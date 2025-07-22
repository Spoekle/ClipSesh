const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const bcrypt = require('bcrypt');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const ytdl = require('ytdl-core');
const axios = require('axios');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');

// Import necessary modules and models
const Clip = require('../models/clipModel');
const IpVote = require('../models/ipVoteModel');
const { PublicConfig } = require('../models/configModel');
const Report = require('../models/reportModel');
const ReportMessage = require('../models/reportMessageModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');
const searchLimiter = require('./middleware/SearchLimiter');
const clipUpload = require('./storage/ClipUpload');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Rating = require('../models/ratingModel');
const { getClipPath, getDailyDirectory, isLegacyPath, getCurrentSeason } = require('../utils/seasonHelpers');

const backendUrl = process.env.BACKEND_URL || 'https://api.spoekle.com';

/**
 * Update the clip count in the public config
 */
async function updateClipCount() {
  try {
    const count = await Clip.countDocuments({ archived: { $ne: true } });
    await PublicConfig.findOneAndUpdate(
      {}, 
      { clipAmount: count }, 
      { upsert: true, new: true }
    );
    console.log(`Updated clipAmount in config: ${count} clips`);
    return count;
  } catch (error) {
    console.error('Error updating clip count:', error);
    return null;
  }
}

/**
 * @swagger
 * tags:
 *   name: clips
 *   description: API for managing clips
 */

// Helper functions for aggregation pipeline
function createRatioField() {
    return {
        ratio: {
            $cond: {
                if: { $eq: [{ $add: ['$upvotes', '$downvotes'] }, 0] },
                then: 0,
                else: { 
                    $multiply: [
                        { $divide: ['$upvotes', { $add: ['$upvotes', '$downvotes'] }] },
                        100
                    ]
                }
            }
        }
    };
}

function createAverageRatingField() {
    return {
        averageRating: {
            $cond: {
                if: { $eq: [{ $size: '$ratingData' }, 0] },
                then: 999, // No ratings - sort to end
                else: {
                    $let: {
                        vars: { rating: { $arrayElemAt: ['$ratingData', 0] } },
                        in: {
                            $cond: {
                                if: { $not: { $ifNull: ['$$rating.ratings', false] } },
                                then: 999,
                                else: {
                                    $let: {
                                        vars: {
                                            counts: {
                                                r1: { $size: { $ifNull: ['$$rating.ratings.1', []] } },
                                                r2: { $size: { $ifNull: ['$$rating.ratings.2', []] } },
                                                r3: { $size: { $ifNull: ['$$rating.ratings.3', []] } },
                                                r4: { $size: { $ifNull: ['$$rating.ratings.4', []] } }
                                            }
                                        },
                                        in: {
                                            $let: {
                                                vars: {
                                                    total: { $add: ['$$counts.r1', '$$counts.r2', '$$counts.r3', '$$counts.r4'] }
                                                },
                                                in: {
                                                    $cond: {
                                                        if: { $eq: ['$$total', 0] },
                                                        then: 1000, // Deny-only clips
                                                        else: {
                                                            $divide: [
                                                                {
                                                                    $add: [
                                                                        { $multiply: [1, '$$counts.r1'] },
                                                                        { $multiply: [2, '$$counts.r2'] },
                                                                        { $multiply: [3, '$$counts.r3'] },
                                                                        { $multiply: [4, '$$counts.r4'] }
                                                                    ]
                                                                },
                                                                '$$total'
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
}

function createRatingCountField() {
    return {
        ratingCount: {
            $cond: {
                if: { $eq: [{ $size: '$ratingData' }, 0] },
                then: 0,
                else: {
                    $let: {
                        vars: { rating: { $arrayElemAt: ['$ratingData', 0] } },
                        in: {
                            $cond: {
                                if: { $not: { $ifNull: ['$$rating.ratings', false] } },
                                then: 0,
                                else: {
                                    $add: [
                                        { $size: { $ifNull: ['$$rating.ratings.1', []] } },
                                        { $size: { $ifNull: ['$$rating.ratings.2', []] } },
                                        { $size: { $ifNull: ['$$rating.ratings.3', []] } },
                                        { $size: { $ifNull: ['$$rating.ratings.4', []] } },
                                        { $size: { $ifNull: ['$$rating.ratings.deny', []] } }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        }
    };
}

function createSortPipeline(sortBy, sortOrder, query) {
    const pipeline = [{ $match: query }];
    
    // Add computed fields based on sort type
    const addFields = {};
    
    if (sortBy === 'ratio') {
        Object.assign(addFields, createRatioField());
    }
    
    if (sortBy === 'averageRating' || sortBy === 'ratingCount') {
        pipeline.push({
            $lookup: {
                from: 'ratings',
                localField: '_id',
                foreignField: 'clipId',
                as: 'ratingData'
            }
        });
        
        if (sortBy === 'averageRating') {
            Object.assign(addFields, createAverageRatingField());
        } else {
            Object.assign(addFields, createRatingCountField());
        }
    }
    
    if (Object.keys(addFields).length > 0) {
        pipeline.push({ $addFields: addFields });
    }
    
    // Handle sorting
    if (sortBy === 'averageRating') {
        // Special handling for average rating - lower is better, deny clips always last
        pipeline.push({
            $addFields: {
                sortPriority: {
                    $cond: {
                        if: { $gte: ['$averageRating', 1000] },
                        then: 1, // Deny/no-rating clips last
                        else: 0
                    }
                }
            }
        });
        pipeline.push({
            $sort: {
                sortPriority: 1,
                [sortBy]: sortOrder === 'asc' ? -1 : 1 // Inverted for ratings
            }
        });
    } else {
        pipeline.push({
            $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
        });
    }
    
    return pipeline;
}

async function getUserRatedClipIds(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return [];
    }
    
    try {
        const ratings = await Rating.find({});
        return ratings.filter(rating => {
            const categories = ['1', '2', '3', '4', 'deny'];
            return categories.some(cat => {
                const ratingsInCategory = rating.ratings?.[cat];
                return Array.isArray(ratingsInCategory) && 
                       ratingsInCategory.some(r => r.userId?.toString() === userId.toString());
            });
        }).map(rating => rating.clipId);
    } catch (error) {
        console.error('Error fetching user ratings:', error);
        return [];
    }
}

/**
 * @swagger
 * /api/clips:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get clips with pagination, filtering, and sorting
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (starting from 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of clips per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (createdAt, upvotes, downvotes, ratio, averageRating, ratingCount)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *         description: Sort direction (asc, desc)
 *       - in: query
 *         name: streamer
 *         schema:
 *           type: string
 *         description: Filter by streamer name
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search clips by title or streamer
 *       - in: query
 *         name: excludeRatedByUser
 *         schema:
 *           type: string
 *         description: User ID to exclude clips rated by this user
 *     responses:
 *       200:
 *         description: OK
 *       500:
 *         description: Internal Server Error
 */
router.get('/', async (req, res) => {
    try {
        let { 
            page = 1, 
            limit = 12, 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            streamer = '',
            search = '',
            excludeRatedByUser = '',
        } = req.query;

        // Parse and validate inputs
        page = Math.max(1, parseInt(page) || 1);
        limit = Math.min(Math.max(1, parseInt(limit) || 12)); // Cap at 100
        
        console.log(`Clips query: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}, streamer=${streamer}, search=${search}, excludeRatedByUser=${excludeRatedByUser}`);
          // Build base query
        const query = {};
        
        // Exclude archived clips from regular fetches
        query.archived = { $ne: true };
        
        if (streamer?.trim()) {
            query.streamer = { $regex: new RegExp(streamer.trim(), 'i') };
        }

        if (search?.trim()) {
            query.$or = [
                { title: { $regex: new RegExp(search.trim(), 'i') } },
                { streamer: { $regex: new RegExp(search.trim(), 'i') } }
            ];
        }

        // Handle user exclusion
        const userRatedClipIds = await getUserRatedClipIds(excludeRatedByUser);
        if (userRatedClipIds.length > 0) {
            query._id = { $nin: userRatedClipIds };
            console.log(`Excluding ${userRatedClipIds.length} clips rated by user ${excludeRatedByUser}`);
        }        // Get total counts
        const totalClipsBeforeFiltering = await Clip.countDocuments({ archived: { $ne: true } });
        const totalClipsAfterAllFilters = await Clip.countDocuments(query);
        
        // Calculate pagination
        const totalPages = Math.max(1, Math.ceil(totalClipsAfterAllFilters / limit));
        const validPage = Math.min(page, totalPages);
        const skip = (validPage - 1) * limit;
        
        console.log(`Pagination: totalClips=${totalClipsAfterAllFilters}, totalPages=${totalPages}, page=${validPage}, skip=${skip}`);
        
        // Execute query
        let clips;
        const complexSortFields = ['ratio', 'averageRating', 'ratingCount'];
        
        if (complexSortFields.includes(sortBy)) {
            // Use aggregation for complex sorting
            const pipeline = createSortPipeline(sortBy, sortOrder, query);
            pipeline.push({ $skip: skip }, { $limit: limit });
            clips = await Clip.aggregate(pipeline);
        } else {
            // Simple sorting for basic fields
            const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
            clips = await Clip.find(query)
                .sort(sortObj)
                .skip(skip)
                .limit(limit)
                .lean();
        }
        
        console.log(`Query executed: found ${clips.length} clips for page ${validPage}`);
        
        // Fetch ratings data
        const ratingsData = await fetchRatingsData(clips);
        
        // Send response
        const response = {
            clips,
            ratings: ratingsData,
            currentPage: validPage,
            totalPages,
            totalClips: totalClipsAfterAllFilters,
            totalUnfilteredClips: totalClipsBeforeFiltering,
            appliedFilters: {
                streamer: streamer || null,
                search: search || null,
                excludeRatedByUser: excludeRatedByUser || null,
            }
        };
        
        console.log(`Response: returning ${clips.length} clips, page ${validPage}/${totalPages}`);
        res.json(response);
    } catch (error) {
        console.error('Error fetching clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function fetchRatingsData(clips) {
    if (clips.length === 0) return {};
    
    const clipIds = clips.map(clip => clip._id);
    const ratings = await Rating.find({ clipId: { $in: clipIds } });
    
    const ratingsData = ratings.reduce((acc, rating) => {
        acc[rating.clipId.toString()] = rating;
        return acc;
    }, {});
    
    // Ensure all clips have rating entries
    clipIds.forEach(clipId => {
        const clipIdStr = clipId.toString();
        if (!ratingsData[clipIdStr]) {
            ratingsData[clipIdStr] = {
                clipId: clipIdStr,
                ratingCounts: []
            };
        }
        
        if (!ratingsData[clipIdStr].ratingCounts) {
            ratingsData[clipIdStr].ratingCounts = [];
        }
    });
    
    return ratingsData;
}

/**
 * @swagger
 * /api/clips/filter-options:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get unique streamers and submitters for filtering
 *     responses:
 *       200:
 *         description: OK
 *       500:
 *         description: Internal Server Error
 */
router.get('/filter-options', async (req, res) => {
    try {
        const clips = await Clip.find({ archived: { $ne: true } }, 'streamer submitter');
        
        // Extract unique streamers and submitters
        const streamers = [...new Set(clips.map(clip => clip.streamer).filter(Boolean))].sort();
        const submitters = [...new Set(clips.map(clip => clip.submitter).filter(Boolean))].sort();
        
        res.json({
            streamers,
            submitters
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/clips/search:
 *   get:
 *     tags:
 *       - clips
 *     summary: Search clips
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sorting option (newest, oldest, upvotes, downvotes)
 *       - in: query
 *         name: streamer
 *         schema:
 *           type: string
 *       - in: query
 *         name: submitter
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Missing parameter
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/search', searchLimiter, async (req, res) => {
    let { q, page = 1, limit = 10, sort = 'newest', streamer, submitter } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Missing search query parameter `q`.' });
    }

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    try {
        console.log(`Search request: q=${q}, page=${page}, limit=${limit}, sort=${sort}, streamer=${streamer || 'all'}, submitter=${submitter || 'all'}`);
        
        // First get all clips from the database with potential filters
        let query = {};
        if (streamer) query.streamer = streamer;
        if (submitter) query.submitter = submitter;
        
        // Use lean() for better performance with large result sets
        const allClips = await Clip.find(query).lean();
        console.log(`Found ${allClips.length} clips matching base filters`);

        // Perform search with Fuse.js
        const options = {
            keys: ['title', 'streamer', 'submitter'],
            threshold: 0.3,
            includeScore: true, // Include match score for potential relevance sorting
        };
        
        const fuse = new Fuse(allClips, options);
        const searchResults = fuse.search(q);
        console.log(`Search found ${searchResults.length} matching clips`);
        
        if (searchResults.length === 0) {
            return res.status(404).json({ 
                message: `No clips found matching "${q}"${streamer ? ` for streamer "${streamer}"` : ''}${submitter ? ` by submitter "${submitter}"` : ''}.` 
            });
        }
        
        // Apply global sorting to all search results
        let sortedResults;
        switch (sort) {
            case 'oldest':
                sortedResults = searchResults.sort((a, b) => new Date(a.item.createdAt) - new Date(b.item.createdAt));
                console.log('Sorting by oldest first');
                break;
            case 'upvotes':
                sortedResults = searchResults.sort((a, b) => b.item.upvotes - a.item.upvotes);
                console.log('Sorting by most upvotes');
                break;
            case 'downvotes':
                sortedResults = searchResults.sort((a, b) => b.item.downvotes - a.item.downvotes);
                console.log('Sorting by most downvotes');
                break;
            case 'newest':
            default:
                sortedResults = searchResults.sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt));
                console.log('Sorting by newest first (default)');
                break;
        }
        
        // Calculate pagination values
        const totalResults = sortedResults.length;
        const totalPages = Math.ceil(totalResults / limit);
        
        // Ensure page number is valid
        if (page > totalPages && totalPages > 0) {
            page = totalPages;
        }
        
        // Get the current page of results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedResults = sortedResults.slice(startIndex, endIndex);
        
        // Extract just the clip data from the search results
        const pageClips = paginatedResults.map(result => result.item);
        
        console.log(`Returning page ${page}/${totalPages} with ${pageClips.length} clips`);

        // Send the response with comprehensive metadata
        res.json({
            clips: pageClips,
            currentPage: page,
            totalPages,
            totalClips: totalResults,
            appliedFilters: {
                query: q,
                streamer: streamer || null,
                submitter: submitter || null,
                sort
            }
        });
    } catch (error) {
        console.error('Error searching clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/clips/info:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get information about a video from its URL without downloading
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: URL of the video to get information about
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Invalid URL
 *       500:
 *         description: Internal Server Error
 */
router.get('/info', authorizeRoles(['uploader', 'admin']), async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Support for YouTube, Twitch, and other platforms
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            try {
                const info = await ytdl.getInfo(url);
                res.json({
                    title: info.title,
                    author: info.author,
                    platform: 'youtube'
                });
            } catch (error) {
                console.error('Error fetching YouTube info:', error);
                res.status(500).json({ error: 'Error fetching YouTube video information' });
            }
        } else if (url.includes('twitch.tv')) {
            try {
                const info = await ytdl.getInfo(url);
                res.json({
                    title: info.title,
                    author: info.channel,
                    platform: 'twitch'
                });

            } catch (error) {
                console.error('Error fetching Twitch info:', error);
                res.status(500).json({ error: 'Error fetching Twitch clip information' });
            }
        } else if (url.includes('medal.tv')) {
            try {
                const info = await ytdl.getInfo(url);
                const title = info.title;
                const author = info.uploader;

                res.json({
                    title: title,
                    author: author,
                    platform: 'medal'
                });
            } catch (error) {
                console.error('Error fetching Medal.tv info:', error);
                res.status(500).json({ error: 'Error fetching Medal.tv clip information' });
            }
        } else {
            // For other URLs, return basic info
            const filename = url.split('/').pop();
            res.json({
                title: filename || 'Video Clip',
                author: 'Unknown',
                platform: 'other'
            });
        }
    } catch (error) {
        console.error('Error in /info endpoint:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/clips/{id}:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get a clip by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Clip not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }
        res.json(clip);
    } catch (error) {
        console.error('Error fetching clip:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/clips/clip-navigation/adjacent:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get adjacent clips (previous and next) for navigation
 *     parameters:
 *       - in: query
 *         name: currentClipId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the current clip
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sorting option to determine clip order
 *       - in: query
 *         name: streamer
 *         schema:
 *           type: string
 *         description: Optional streamer filter
 *       - in: query
 *         name: getAdjacent
 *         schema:
 *           type: boolean
 *         description: Must be true to get adjacent clips
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Clip not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/clip-navigation/adjacent', async (req, res) => {
    try {
        const { currentClipId, sort = 'newest', streamer, getAdjacent, excludeRatedByUser } = req.query;
        
        if (!currentClipId || getAdjacent !== 'true') {
            return res.status(400).json({ error: 'Required parameters missing' });
        }

        const currentClip = await Clip.findById(currentClipId);
        if (!currentClip) {
            return res.status(404).json({ error: 'Current clip not found' });
        }        
        const baseQuery = { archived: { $ne: true } }; // Exclude archived clips
        if (streamer) {
            baseQuery.streamer = { $regex: new RegExp(streamer, 'i') };
        }
        
        // Add excludeRatedByUser filtering
        if (excludeRatedByUser) {
            const userRatedClipIds = await getUserRatedClipIds(excludeRatedByUser);
            if (userRatedClipIds.length > 0) {
                baseQuery._id = { $nin: userRatedClipIds };
                console.log(`Excluding ${userRatedClipIds.length} clips rated by user ${excludeRatedByUser} from adjacent clips`);
                
                // Debug: Get total available clips before and after filtering
                const totalClipsBeforeFilter = await Clip.countDocuments({ archived: { $ne: true } });
                const totalClipsAfterFilter = await Clip.countDocuments(baseQuery);
                console.log(`Total clips before filtering: ${totalClipsBeforeFilter}, after filtering: ${totalClipsAfterFilter}`);
            }
        }
        
        let sortField = 'createdAt';
        let sortDirection = -1;
        
        switch (sort) {
            case 'oldest':
                sortField = 'createdAt';
                sortDirection = 1;
                break;
            case 'highestUpvotes':
                sortField = 'upvotes';
                sortDirection = -1;
                break;
            case 'highestDownvotes':
                sortField = 'downvotes';
                sortDirection = -1;
                break;
            case 'newest':
            default:
                sortField = 'createdAt';
                sortDirection = -1;
                break;
        }

        console.log(`Finding adjacent clips for ${currentClipId} with sort: ${sort} (${sortField}, direction: ${sortDirection})`);
        console.log(`Current clip ${sortField} value:`, currentClip[sortField]);
        console.log(`Base query (includes excludeRatedByUser filters):`, JSON.stringify(baseQuery));

        // For "previous" clip in the navigation context:
        // - If sorting newest first (descending), previous = newer clips (higher timestamp)
        // - If sorting oldest first (ascending), previous = older clips (lower timestamp)
        const prevClipQuery = { ...baseQuery };
        if (sortDirection === -1) {
            // Descending sort: previous = newer (higher value)
            prevClipQuery[sortField] = { $gt: currentClip[sortField] };
        } else {
            // Ascending sort: previous = older (lower value)
            prevClipQuery[sortField] = { $lt: currentClip[sortField] };
        }
        
        console.log('Previous clip query:', JSON.stringify(prevClipQuery));
        const prevClip = await Clip.findOne(prevClipQuery)
            .sort({ [sortField]: -sortDirection }) // Reverse sort to get closest match
            .limit(1);
        
        // For "next" clip in the navigation context:
        // - If sorting newest first (descending), next = older clips (lower timestamp)
        // - If sorting oldest first (ascending), next = newer clips (higher timestamp)
        const nextClipQuery = { ...baseQuery };
        if (sortDirection === -1) {
            // Descending sort: next = older (lower value)
            nextClipQuery[sortField] = { $lt: currentClip[sortField] };
        } else {
            // Ascending sort: next = newer (higher value)
            nextClipQuery[sortField] = { $gt: currentClip[sortField] };
        }
        
        console.log('Next clip query:', JSON.stringify(nextClipQuery));
        const nextClip = await Clip.findOne(nextClipQuery)
            .sort({ [sortField]: sortDirection }) // Same sort direction to get closest match
            .limit(1);
        
        console.log(`Found previous clip: ${prevClip?._id || 'none'} (${sortField}: ${prevClip?.[sortField] || 'none'})`);
        console.log(`Found next clip: ${nextClip?._id || 'none'} (${sortField}: ${nextClip?.[sortField] || 'none'})`);
        
        res.json({
            previous: prevClip,
            next: nextClip
        });
    } catch (error) {
        console.error('Error fetching adjacent clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Compress video using ffmpeg to h.264 format
 * @param {string} inputPath - Path to input video file
 * @returns {Promise<string>} - Path to compressed video
 */
async function compressVideo(inputPath) {
    const outputPath = `${inputPath}.compressed.mp4`;
    
    return new Promise((resolve, reject) => {
        console.log(`Compressing video: ${inputPath} to ${outputPath}`);
        
        ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .outputOptions('-crf 23')  // Same compression quality as Discord bot
            .on('end', () => {
                console.log('Video compression completed');
                
                // Replace original with compressed version
                try {
                    fs.unlinkSync(inputPath);
                    fs.renameSync(outputPath, inputPath);
                    resolve(inputPath);
                } catch (err) {
                    console.error('Error replacing original file:', err);
                    resolve(outputPath); // Use compressed version if rename fails
                }
            })
            .on('error', (err) => {
                console.error('Error compressing video:', err);
                reject(err);
            })
            .run();
    });
}

/**
 * Download a clip from a URL using ytdl-core
 * @param {string} url - URL of the video to download
 * @returns {Promise<{filePath: string, fileName: string, info: Object}>}
 */
async function downloadClipFromUrl(url) {
    return new Promise(async (resolve, reject) => {
        try {
            // Create a unique ID for this download
            const uniqueId = uuidv4();
            const uploadsBaseDir = path.join(__dirname, '..', 'uploads');
            const filename = `${uniqueId}.mp4`;
            
            // Get the season/date-based path for the file
            const { fullPath: outputPath, relativePath } = getClipPath(uploadsBaseDir, filename);
            
            console.log(`Downloading from URL: ${url} to ${outputPath}`);
            
            // Process based on platform
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                // YouTube videos using ytdl-core
                try {
                    const info = await ytdl.getInfo(url);
                    
                    // Get the best video format with audio
                    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
                    
                    // Create write stream to save the video
                    const writeStream = fs.createWriteStream(outputPath);
                    
                    // Download the video
                    ytdl(url, { format: format })
                        .pipe(writeStream)
                        .on('finish', () => {
                            console.log('YouTube video download completed');
                            
                            resolve({
                                filePath: outputPath,
                                fileName: filename,
                                relativePath: relativePath,
                                info: {
                                    title: info.videoDetails.title,
                                    author: info.videoDetails.author.name
                                }
                            });
                        })
                        .on('error', (err) => {
                            console.error('Error downloading YouTube video:', err);
                            reject(err);
                        });
                } catch (err) {
                    console.error('Error getting YouTube video info:', err);
                    reject(err);
                }
            } else if (url.includes('twitch.tv')) {
                // For Twitch, we'll use their API to get clip info
                try {
                    // Extract the clip slug from the URL
                    const clipSlug = url.split('/').pop();
                    
                    // First approach: Try direct download from the source URL
                    let downloadUrl = null;
                    
                    // For Twitch clips, the download URL is typically in the page content
                    // We'll make a request to the clip page and extract the mp4 URL
                    try {
                        const response = await axios.get(url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        });
                        
                        const htmlContent = response.data;
                        
                        // Try to find the clip URL in the page content
                        // This pattern looks for mp4 URLs within the page source
                        const mp4UrlPattern = /(https:\/\/[^"]+\.mp4[^"]*)/;
                        const match = htmlContent.match(mp4UrlPattern);
                        
                        if (match && match[1]) {
                            downloadUrl = match[1];
                            console.log(`Found Twitch clip download URL: ${downloadUrl}`);
                        }
                    } catch (err) {
                        console.error('Error extracting Twitch clip info:', err);
                    }
                    
                    if (downloadUrl) {
                        // Download the clip directly
                        const fileStream = fs.createWriteStream(outputPath);
                        
                        const protocol = downloadUrl.startsWith('https') ? https : http;
                        
                        await new Promise((resolveDownload, rejectDownload) => {
                            protocol.get(downloadUrl, response => {
                                response.pipe(fileStream);
                                
                                fileStream.on('finish', () => {
                                    fileStream.close();
                                    console.log('Twitch clip download completed');
                                    resolveDownload();
                                });
                            }).on('error', err => {
                                fs.unlink(outputPath, () => {});
                                rejectDownload(err);
                            });
                        });
                        
                        // Extract some basic info from the URL or page title
                        resolve({
                            filePath: outputPath,
                            fileName: filename,
                            relativePath: relativePath,
                            info: {
                                title: `Twitch Clip ${clipSlug}`,
                                author: 'Twitch Streamer'
                            }
                        });
                    } else {
                        throw new Error('Could not find Twitch clip download URL');
                    }
                } catch (err) {
                    console.error('Error downloading Twitch clip:', err);
                    reject(err);
                }
            } else if (url.includes('medal.tv')) {
                // Medal.tv clips
                try {
                    // For Medal.tv, we'll try to extract the clip URL from the page
                    const response = await axios.get(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });
                    
                    const htmlContent = response.data;
                    
                    // Try to find the clip URL in the page content
                    // This pattern looks for mp4 URLs within the page source
                    const mp4UrlPattern = /(https:\/\/[^"]+\.mp4[^"]*)/;
                    const match = htmlContent.match(mp4UrlPattern);
                    
                    if (match && match[1]) {
                        const downloadUrl = match[1];
                        console.log(`Found Medal.tv clip download URL: ${downloadUrl}`);
                        
                        // Download the clip
                        const fileStream = fs.createWriteStream(outputPath);
                        
                        const protocol = downloadUrl.startsWith('https') ? https : http;
                        
                        await new Promise((resolveDownload, rejectDownload) => {
                            protocol.get(downloadUrl, response => {
                                response.pipe(fileStream);
                                
                                fileStream.on('finish', () => {
                                    fileStream.close();
                                    console.log('Medal.tv clip download completed');
                                    resolveDownload();
                                });
                            }).on('error', err => {
                                fs.unlink(outputPath, () => {});
                                rejectDownload(err);
                            });
                        });
                        
                        // Extract title if available
                        let title = 'Medal.tv Clip';
                        const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/);
                        if (titleMatch && titleMatch[1]) {
                            title = titleMatch[1].trim();
                        }
                        
                        resolve({
                            filePath: outputPath,
                            fileName: filename,
                            relativePath: relativePath,
                            info: {
                                title: title,
                                author: 'Medal.tv User'
                            }
                        });
                    } else {
                        throw new Error('Could not find Medal.tv clip download URL');
                    }
                } catch (err) {
                    console.error('Error downloading Medal.tv clip:', err);
                    reject(err);
                }
            } else {
                // Default for other URLs - attempt direct download
                try {
                    const fileStream = fs.createWriteStream(outputPath);
                    const protocol = url.startsWith('https') ? https : http;
                    
                    await new Promise((resolveDownload, rejectDownload) => {
                        protocol.get(url, response => {
                            if (response.statusCode !== 200) {
                                rejectDownload(new Error(`Failed to download: Status code ${response.statusCode}`));
                                return;
                            }
                            
                            response.pipe(fileStream);
                            
                            fileStream.on('finish', () => {
                                fileStream.close();
                                console.log('Direct download completed');
                                resolveDownload();
                            });
                        }).on('error', err => {
                            fs.unlink(outputPath, () => {});
                            rejectDownload(err);
                        });
                    });
                    
                    resolve({
                        filePath: outputPath,
                        fileName: filename,
                        relativePath: relativePath,
                        info: {
                            title: path.basename(url),
                            author: 'Unknown'
                        }
                    });
                } catch (err) {
                    console.error('Error downloading from URL:', err);
                    reject(err);
                }
            }
        } catch (error) {
            console.error('Error in downloadClipFromUrl:', error);
            reject(error);
        }
    });
}

router.post('/', authorizeRoles(['uploader', 'admin']), clipUpload.single('clip'), async (req, res) => {
    console.log("=== Handling new clip upload ===");
    try {
        const { streamer, submitter, title, link, discordSubmitterId } = req.body;
        console.log("Request body:", { streamer, submitter, title, link, discordSubmitterId });

        let fileUrl;
        let thumbnailUrl;
        let finalTitle = title;
        
        // Case 1: Direct file upload
        if (req.file) {
            // req.file.path already contains the full path with season/date structure
            const uploadPath = req.file.path;
            const uploadsBaseDir = path.join(__dirname, '..', 'uploads');
            const relativePath = path.relative(uploadsBaseDir, uploadPath);
            
            console.log("File uploaded to:", uploadPath);
            console.log("Relative path:", relativePath);
            
            try {
                // Compress the video file with ffmpeg (same as Discord bot)
                await compressVideo(uploadPath);
                console.log("Video compressed successfully");
            } catch (compressionError) {
                console.error("Error compressing video:", compressionError);
                // Continue with uncompressed video if compression fails
            }

            // Use relative path for URL to support both legacy and new structure
            fileUrl = `${backendUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

            // Generate thumbnail in the same directory as the video
            const thumbnailFilename = `${path.parse(req.file.filename).name}_thumbnail.png`;
            const thumbnailDirectory = path.dirname(uploadPath);
            const thumbnailPath = path.join(thumbnailDirectory, thumbnailFilename);
            const thumbnailRelativePath = path.relative(uploadsBaseDir, thumbnailPath);
            
            console.log("Generating thumbnail:", thumbnailFilename);

            await new Promise((resolve, reject) => {
                ffmpeg(uploadPath)
                    .screenshots({
                        timestamps: ['00:00:00.001'],
                        filename: thumbnailFilename,
                        folder: thumbnailDirectory,
                        size: '640x360',
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            thumbnailUrl = `${backendUrl}/uploads/${thumbnailRelativePath.replace(/\\/g, '/')}`;
            console.log("Thumbnail URL:", thumbnailUrl);
        } 
        // Case 2: URL-based clip from YouTube, Twitch, etc.
        else if (link && (link.includes('youtube.com') || link.includes('youtu.be') || 
                link.includes('twitch.tv') || link.includes('medal.tv'))) {
            console.log("Downloading clip from URL:", link);
            try {
                // Download the clip using our new Node.js based function
                const downloadResult = await downloadClipFromUrl(link);
                
                // Extract useful metadata from the download result
                if (downloadResult.info.title && !finalTitle) {
                    finalTitle = downloadResult.info.title;
                }
                
                // Use the relative path for the URL
                fileUrl = `${backendUrl}/uploads/${downloadResult.relativePath.replace(/\\/g, '/')}`;
                
                // Generate thumbnail for the downloaded file in the same directory
                const thumbnailFilename = `${path.parse(downloadResult.fileName).name}_thumbnail.png`;
                const thumbnailDirectory = path.dirname(downloadResult.filePath);
                const uploadsBaseDir = path.join(__dirname, '..', 'uploads');
                const thumbnailPath = path.join(thumbnailDirectory, thumbnailFilename);
                const thumbnailRelativePath = path.relative(uploadsBaseDir, thumbnailPath);
                
                await new Promise((resolve, reject) => {
                    ffmpeg(downloadResult.filePath)
                        .screenshots({
                            timestamps: ['00:00:00.001'],
                            filename: thumbnailFilename,
                            folder: thumbnailDirectory,
                            size: '640x360',
                        })
                        .on('end', resolve)
                        .on('error', reject);
                });
                
                thumbnailUrl = `${backendUrl}/uploads/${thumbnailRelativePath.replace(/\\/g, '/')}`;
                console.log("Downloaded and processed URL-based clip:", fileUrl);
            } catch (error) {
                console.error("Error downloading from URL:", error);
                return res.status(400).json({ error: 'Failed to download clip from URL: ' + error.message });
            }
        } 
        // Case 3: Direct URL to a video file
        else if (link && /\.(mp4|webm|mov)$/i.test(link)) {
            fileUrl = link;
            thumbnailUrl = null;
            console.log("Using direct video URL:", fileUrl);
        }
        else {
            console.log("No file or valid link provided.");
            return res.status(400).json({ error: 'No file or valid link provided' });        }

        // Get current season and year
        const { season, year } = getCurrentSeason();

        const newClip = new Clip({ 
            url: fileUrl, 
            thumbnail: thumbnailUrl, 
            streamer, 
            submitter, 
            title: finalTitle || title, 
            link,
            discordSubmitterId,
            season: season.charAt(0).toUpperCase() + season.slice(1), // Capitalize first letter
            year: year
        });
        await newClip.save();

        console.log("New clip saved:", newClip);

        // Update clip count in config
        await updateClipCount();

        res.json({ success: true, clip: newClip });
    } catch (error) {
        console.error("Error processing clip upload:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', authorizeRoles(['uploader', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { streamer, submitter, title, discordSubmitterId, link, archived, season, year } = req.body;

    try {
        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        if (streamer !== undefined) {
            clip.streamer = streamer;
        }

        if (submitter !== undefined) {
            clip.submitter = submitter;
        }

        if (discordSubmitterId !== undefined) {
            clip.discordSubmitterId = discordSubmitterId;
        }

        if (title !== undefined) {
            clip.title = title;
        }

        if (link !== undefined) {
            clip.link = link;
        }

        if (archived !== undefined) {
            clip.archived = archived;
            // Set archivedAt timestamp when archiving
            if (archived && !clip.archivedAt) {
                clip.archivedAt = new Date();
            } else if (!archived) {
                clip.archivedAt = undefined;
            }
        }

        if (season !== undefined) {
            clip.season = season;
        }

        if (year !== undefined) {
            clip.year = year;
        }

        await clip.save();

        res.json({ message: 'Clip updated successfully', clip });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authorizeRoles(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const clip = await Clip.findById(id);
        if (clip) {
            try {
                // Extract file path from URL - handle both legacy and new structures
                const uploadsBaseDir = path.join(__dirname, '..', 'uploads');
                let filePath;
                
                if (clip.url.includes('uploads/')) {
                    // Extract the path after 'uploads/'
                    const urlPath = clip.url.split('uploads/')[1];
                    filePath = path.join(uploadsBaseDir, urlPath);
                } else {
                    // Fallback for legacy structure
                    filePath = path.join(uploadsBaseDir, path.basename(clip.url));
                }
                
                console.log("Attempting to delete file:", filePath);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log("File deleted successfully");
                } else {
                    console.log("File not found, continuing with database deletion");
                }
                
                // Also try to delete thumbnail if it exists
                const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumbnail.png');
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                    console.log("Thumbnail deleted successfully");
                }
            } catch (error) {
                console.error("Error removing file:", error.message);
            }
            await clip.deleteOne();

            // Update clip count in config
            await updateClipCount();

            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Clip not found' });
        }
    } catch (error) {
        console.error('Error deleting clip:', error); // Added error logging for debugging
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/', authorizeRoles(['admin']), async (req, res) => {
    try {
        await Clip.deleteMany({});
        
        // Recursively delete all files in uploads directory
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        
        function deleteDirectoryRecursive(dirPath) {
            if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    const curPath = path.join(dirPath, file);
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteDirectoryRecursive(curPath);
                    } else {
                        try {
                            fs.unlinkSync(curPath);
                        } catch (err) {
                            console.error(`Error deleting file ${curPath}:`, err);
                        }
                    }
                }
                
                // Only delete the directory if it's not the main uploads directory
                if (dirPath !== uploadsDir) {
                    try {
                        fs.rmdirSync(dirPath);
                    } catch (err) {
                        console.error(`Error deleting directory ${dirPath}:`, err);
                    }
                }
            }
        }
        
        deleteDirectoryRecursive(uploadsDir);

        // Update clip count in config to 0
        await PublicConfig.findOneAndUpdate(
            {}, 
            { clipAmount: 0 }, 
            { upsert: true, new: true }
        );
        console.log("Reset clipAmount to 0 after deleting all clips");

        res.json({ success: true, message: 'All clips deleted successfully' });
    } catch (error) {
        console.error('Error deleting all clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fix the vote handling code
router.post('/:id/vote/:voteType', async (req, res) => {
    try {
        const clientIp = req.ip;
        const { id, voteType } = req.params;

        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).send('Clip not found');
        }

        const existingVotes = await IpVote.find({ clipId: id });

        for (const vote of existingVotes) {
            if (await bcrypt.compare(clientIp, vote.ip)) {
                if (vote.vote === voteType) {
                    // Same vote => remove vote
                    if (voteType === 'upvote') {
                        clip.upvotes -= 1;
                    } else {
                        clip.downvotes -= 1;
                    }
                    // Use deleteOne() instead of remove()
                    await vote.deleteOne();
                    await clip.save();
                    return res.send(clip);
                } else {
                    // Switching vote
                    if (voteType === 'upvote') {
                        clip.upvotes += 1;
                        clip.downvotes -= 1;
                    } else {
                        clip.downvotes += 1;
                        clip.upvotes -= 1;
                    }
                    vote.vote = voteType;
                    await vote.save();
                    await clip.save();
                    return res.send(clip);
                }
            }
        }

        const hashedIp = await bcrypt.hash(clientIp, 10);
        if (voteType === 'upvote') {
            clip.upvotes += 1;
        } else {
            clip.downvotes += 1;
        }
        const newVote = new IpVote({ clipId: id, ip: hashedIp, vote: voteType });
        await newVote.save();
        await clip.save();
        res.send(clip);
    } catch (error) {
        console.error('Error voting clip:', error.message);
        res.status(500).send('Internal server error');
    }
});

router.get('/:id/vote/status', async (req, res) => {
    try {
        const clientIp = req.ip;
        const { id } = req.params;

        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        const existingVotes = await IpVote.find({ clipId: id });
        
        // Check if the user has already voted
        for (const vote of existingVotes) {
            if (await bcrypt.compare(clientIp, vote.ip)) {
                // Return the vote type
                return res.json({ hasVoted: true, voteType: vote.vote });
            }
        }
        
        // If no vote found
        res.json({ hasVoted: false });
    } catch (error) {
        console.error('Error checking vote status:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Comment on post - Store userId correctly
router.post('/:id/comment', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const username = req.user.username;
    const userId = req.user.id;  // Get the user ID from the request

    if (!comment) {
        return res.status(400).json({ error: 'Comment is required' });
    }

    try {
        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Store both username and userId
        clip.comments.push({ userId, username, comment });
        await clip.save();

        res.json(clip);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fix the delete comment function
router.delete('/:clipId/comment/:commentId', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
    const { clipId, commentId } = req.params;
    const username = req.user.username;

    try {
        const clip = await Clip.findById(clipId);
        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        const comment = clip.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.username == username || req.user.roles.includes('admin')) {
            // Use pull() instead of remove() for subdocuments
            clip.comments.pull({ _id: commentId });
            await clip.save();
            return res.json(clip);
        } else {
            return res.status(403).json({ error: 'Forbidden: You do not have the required permissions' });
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Reply to a comment
 */
router.post('/:clipId/comment/:commentId/reply', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  const { clipId, commentId } = req.params;
  const { replyText } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  if (!replyText || replyText.trim() === '') {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  try {
    const clip = await Clip.findById(clipId);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    // Find the comment to reply to
    const comment = clip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Add debug logs for the notification
    console.log('Comment user ID:', comment.userId);
    console.log('Current user ID:', userId);

    // Add the reply to the comment
    const reply = {
      userId,
      username,
      replyText,
      createdAt: new Date()
    };
    
    comment.replies.push(reply);
    await clip.save();
    
    // Get the newly created reply's ID
    const newReply = comment.replies[comment.replies.length - 1];

    // Create notification for the original commenter if it's not the same user
    if (comment.userId && comment.userId.toString() !== userId.toString()) {
      const notification = new Notification({
        recipientId: comment.userId,
        senderId: userId,
        senderUsername: username,
        type: 'comment_reply',
        entityId: commentId, // The comment ID
        replyId: newReply._id, // The new reply ID
        clipId: clipId,
        message: `${username} replied to your comment: "${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}"`,
      });

      await notification.save();
      console.log('Notification created successfully for user:', comment.userId);
    } else {
      console.log('Notification not created because:',
        !comment.userId ? 'comment.userId is missing' : 'user is replying to their own comment');
    }

    res.json(clip);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fix the delete reply function
router.delete('/:clipId/comment/:commentId/reply/:replyId', authorizeRoles(['user', 'clipteam', 'editor', 'uploader', 'admin']), async (req, res) => {
  const { clipId, commentId, replyId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.roles.includes('admin');

  try {
    const clip = await Clip.findById(clipId);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    const comment = clip.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    // Check if the user is the author of the reply or an admin
    if (reply.userId.toString() === userId || isAdmin) {
      // Use pull() instead of remove() for subdocuments
      comment.replies.pull({ _id: replyId });
      await clip.save();
      return res.json(clip);
    } else {
      return res.status(403).json({ error: 'You are not authorized to delete this reply' });
    }
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/clips/user/{discordId}:
 *   get:
 *     tags:
 *       - clips
 *     summary: Get clips submitted by a specific user
 *     parameters:
 *       - in: path
 *         name: discordId
 *         schema:
 *           type: string
 *         required: true
 *         description: Discord ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of clips per page
 *     responses:
 *       200:
 *         description: List of clips submitted by the user
 *       404:
 *         description: No clips found for this user
 *       500:
 *         description: Internal Server Error
 */
router.get('/user/:discordId', async (req, res) => {
    try {
        const { discordId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
          // Build query to find clips by Discord submitter ID
        const query = { 
            discordSubmitterId: discordId,
            archived: { $ne: true } // Exclude archived clips
        };
        
        // Get total count for pagination
        const totalClips = await Clip.countDocuments(query);
        
        // Get clips with pagination
        const clips = await Clip.find(query)
            .sort({ createdAt: -1 }) // Most recent first
            .skip(skip)
            .limit(limitNumber)
            .lean();
        
        const totalPages = Math.ceil(totalClips / limitNumber);
        
        res.json({
            clips,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalClips,
                limit: limitNumber,
                hasNext: pageNumber < totalPages,
                hasPrev: pageNumber > 1
            }
        });
    } catch (error) {
        console.error('Error fetching user clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Report a clip
 */
router.post('/:id/report', authorizeRoles(['clipteam', 'editor', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const reporterId = req.user.id;
        const reporterUsername = req.user.username;
        
        // Validate required fields
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ error: 'Report reason is required' });
        }
        
        // Check if clip exists
        const clip = await Clip.findById(id);
        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }
        
        // Check if user has already reported this clip
        const existingReport = await Report.findOne({
            clipId: id,
            reporterId: reporterId
        });
        
        if (existingReport) {
            return res.status(400).json({ error: 'You have already reported this clip' });
        }
        
        // Create the report
        const report = new Report({
            clipId: id,
            clipTitle: clip.title,
            clipStreamer: clip.streamer,
            clipSubmitter: clip.submitter,
            reporterId: reporterId,
            reporterUsername: reporterUsername,
            reason: reason.trim()
        });
        
        await report.save();
        
        // Create notifications for all admins
        const adminUsers = await User.find({ roles: 'admin' });
        
        const notifications = adminUsers.map(admin => new Notification({
            recipientId: admin._id,
            senderId: reporterId,
            senderUsername: reporterUsername,
            type: 'report',
            clipId: id,
            message: `${reporterUsername} reported a clip: "${clip.title}" by ${clip.streamer}`,
            entityId: report._id // Store the report ID as the entity ID
        }));
        
        await Notification.insertMany(notifications);
        
        res.status(201).json({
            message: 'Clip reported successfully',
            report: {
                _id: report._id,
                clipId: report.clipId,
                reason: report.reason,
                status: report.status,
                createdAt: report.createdAt
            }
        });
        
    } catch (error) {
        console.error('Error reporting clip:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Get user's own reports
 */
router.get('/reports/my', authorizeRoles(['user', 'clipteam', 'editor', 'admin']), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const reports = await Report.find({ reporterId: userId })
            .sort({ createdAt: -1 });
        
        res.json(reports);
        
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Get messages for user's own report
 */
router.get('/reports/:reportId/messages', authorizeRoles(['user', 'clipteam', 'editor', 'admin']), async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.user.id;
        
        // Check if report exists and belongs to user (or user is admin)
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        const isAdmin = req.user.roles && req.user.roles.includes('admin');
        const isReporter = report.reporterId.toString() === userId;
        
        if (!isAdmin && !isReporter) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Get messages (exclude internal messages if not admin)
        const query = { reportId };
        if (!isAdmin) {
            query.isInternal = false;
        }
        
        const messages = await ReportMessage.find(query)
            .sort({ createdAt: 1 });
        
        // Mark messages as read by current user
        const unreadMessages = messages.filter(msg => 
            !msg.readBy.some(read => read.userId.toString() === userId)
        );
        
        if (unreadMessages.length > 0) {
            await Promise.all(unreadMessages.map(msg => 
                ReportMessage.findByIdAndUpdate(msg._id, {
                    $push: {
                        readBy: {
                            userId,
                            username: req.user.username,
                            readAt: new Date()
                        }
                    }
                })
            ));
        }
        
        res.json(messages);
        
    } catch (error) {
        console.error('Error fetching report messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * Send message to report
 */
router.post('/reports/:reportId/messages', authorizeRoles(['user', 'clipteam', 'editor', 'admin']), async (req, res) => {
    try {
        const { reportId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;
        const username = req.user.username;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        
        // Check if report exists and belongs to user (or user is admin)
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        const isAdmin = req.user.roles && req.user.roles.includes('admin');
        const isReporter = report.reporterId.toString() === userId;
        
        if (!isAdmin && !isReporter) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Prevent messaging if report is resolved or dismissed (only for non-admin users)
        if (!isAdmin && (report.status === 'resolved' || report.status === 'dismissed')) {
            return res.status(400).json({ 
                error: 'Cannot send messages to resolved or dismissed reports',
                message: `This report has been ${report.status} and no longer accepts new messages.`
            });
        }
        
        // Create message
        const newMessage = new ReportMessage({
            reportId,
            senderId: userId,
            senderUsername: username,
            senderRole: isAdmin ? 'admin' : 'reporter',
            message: message.trim(),
            isInternal: false, // User-facing messages are never internal
            readBy: [{
                userId,
                username,
                readAt: new Date()
            }]
        });
        
        await newMessage.save();
        
        // Create notification for the other party
        if (isAdmin) {
            // Admin messaging reporter
            const notification = new Notification({
                recipientId: report.reporterId,
                senderId: userId,
                senderUsername: username,
                type: 'report',
                entityId: reportId,
                clipId: report.clipId,
                message: `Admin replied to your report on "${report.clipTitle}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
                read: false
            });
            
            await notification.save();
        } else {
            // Reporter messaging admins
            const adminUsers = await User.find({ roles: 'admin', status: 'active' });
            
            const notifications = adminUsers.map(admin => new Notification({
                recipientId: admin._id,
                senderId: userId,
                senderUsername: username,
                type: 'report',
                entityId: reportId,
                clipId: report.clipId,
                message: `New message on report for "${report.clipTitle}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
                read: false
            }));
            
            await Notification.insertMany(notifications);
        }
        
        res.status(201).json(newMessage);
        
    } catch (error) {
        console.error('Error sending report message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;