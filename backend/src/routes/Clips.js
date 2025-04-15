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
const mongoose = require('mongoose'); // Add this import

// Import necessary modules and models
const Clip = require('../models/clipModel');
const IpVote = require('../models/ipVoteModel');
const { PublicConfig } = require('../models/configModel'); // Add this import
const authorizeRoles = require('./middleware/AuthorizeRoles');
const searchLimiter = require('./middleware/SearchLimiter');
const clipUpload = require('./storage/ClipUpload');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Rating = require('../models/ratingModel'); // Add this import

/**
 * Update the clip count in the public config
 */
async function updateClipCount() {
  try {
    const count = await Clip.countDocuments();
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
 *         description: Field to sort by (createdAt, upvotes, downvotes)
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
 *       - in: query
 *         name: includeRatings
 *         schema:
 *           type: boolean
 *         description: Include ratings data in the response
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
            includeRatings = false
        } = req.query;

        // Parse numeric values and boolean flags
        page = parseInt(page);
        limit = parseInt(limit);
        includeRatings = includeRatings === 'true';

        // Ensure limit doesn't exceed reasonable bounds
        limit = Math.min(limit, 100);
        
        console.log(`Clips query: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}, streamer=${streamer}, search=${search}, excludeRatedByUser=${excludeRatedByUser}`);
        
        // Basic query object
        const query = {};
        
        // Add streamer filter if provided
        if (streamer) {
            query.streamer = { $regex: new RegExp(streamer, 'i') };
        }

        // Add search term filter if provided
        if (search) {
            query.$or = [
                { title: { $regex: new RegExp(search, 'i') } },
                { streamer: { $regex: new RegExp(search, 'i') } }
            ];
        }

        // Get total count of all clips (for overall pagination)
        const totalClipsBeforeFiltering = await Clip.countDocuments({});

        // Get total count after basic filters (streamer, search)
        const totalClipsAfterBasicFilters = await Clip.countDocuments(query);
        
        // Create sort object based on sort option
        const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        
        // Find all ratings by the user if excludeRatedByUser is specified
        let userRatedClipIds = [];
        if (excludeRatedByUser && mongoose.Types.ObjectId.isValid(excludeRatedByUser)) {
            try {
                // More efficient approach: Find only ratings where this specific user has rated
                const ratings = await Rating.find({});
                
                // Filter to find clips rated by this specific user
                userRatedClipIds = ratings.filter(rating => {
                    // Check each rating category (1-4 and deny)
                    const categories = ['1', '2', '3', '4', 'deny'];
                    for (const cat of categories) {
                        if (rating.ratings && 
                            rating.ratings[cat] && 
                            Array.isArray(rating.ratings[cat])) {
                            // Check if user has rated in this category
                            const userRated = rating.ratings[cat].some(r => 
                                r.userId && r.userId.toString() === excludeRatedByUser.toString()
                            );
                            if (userRated) return true;
                        }
                    }
                    return false;
                }).map(rating => rating.clipId);
                
                console.log(`Found ${userRatedClipIds.length} clips rated by user ${excludeRatedByUser}`);
                
                // Add to query to exclude these clips
                if (userRatedClipIds.length > 0) {
                    query._id = { $nin: userRatedClipIds };
                }
            } catch (error) {
                console.error('Error fetching user ratings:', error);
            }
        }
        
        // Count clips after all filters applied
        const totalClipsAfterAllFilters = await Clip.countDocuments(query);
        
        // Calculate total pages based on filtered clips
        const totalPages = Math.ceil(totalClipsAfterAllFilters / limit) || 1;
        
        // Adjust page number if it exceeds total pages
        page = Math.max(1, Math.min(page, totalPages));
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // If we're excluding rated clips, we might need to fetch more than the limit
        // to ensure we have enough clips to display after filtering
        const fetchLimit = excludeRatedByUser ? limit : limit;
        
        // Fetch clips with pagination and sorting
        let clips = await Clip.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(fetchLimit);
        
        // Prepare ratings data if requested
        let ratingsData = {};
        if (includeRatings && clips.length > 0) {
            const clipIds = clips.map(clip => clip._id);
            
            // Fetch ratings for all clips on this page
            const ratings = await Rating.find({ clipId: { $in: clipIds } });
            
            // Organize ratings by clip ID - ensure we convert ObjectId to string for consistent key access
            ratingsData = ratings.reduce((acc, rating) => {
                acc[rating.clipId.toString()] = rating;
                return acc;
            }, {});
            
            // Make sure each clip has an entry in the ratings data, even if empty
            clipIds.forEach(clipId => {
                const clipIdStr = clipId.toString();
                if (!ratingsData[clipIdStr]) {
                    ratingsData[clipIdStr] = {
                        clipId: clipIdStr,
                        ratingCounts: []
                    };
                }
                
                // Ensure the ratingCounts array exists
                if (!ratingsData[clipIdStr].ratingCounts) {
                    ratingsData[clipIdStr].ratingCounts = [];
                }
            });
        }
        
        // Send the response with comprehensive metadata
        res.json({
            clips,
            ratings: includeRatings ? ratingsData : undefined,
            currentPage: page,
            totalPages,
            totalClips: totalClipsAfterAllFilters,
            totalUnfilteredClips: totalClipsBeforeFiltering,
            appliedFilters: {
                streamer: streamer || null,
                search: search || null,
                excludeRatedByUser: excludeRatedByUser || null
            }
        });
    } catch (error) {
        console.error('Error fetching clips:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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
        const clips = await Clip.find({}, 'streamer submitter');
        
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
                    title: info.videoDetails.title,
                    author: info.videoDetails.author.name,
                    platform: 'youtube'
                });
            } catch (error) {
                console.error('Error fetching YouTube info:', error);
                res.status(500).json({ error: 'Error fetching YouTube video information' });
            }
        } else if (url.includes('twitch.tv')) {
            try {
                // For Twitch, we'll make a request to the clip page and extract basic info
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                const htmlContent = response.data;
                
                // Extract title if available (basic regex, can be improved)
                let title = 'Twitch Clip';
                const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/);
                if (titleMatch && titleMatch[1]) {
                    title = titleMatch[1].trim();
                }
                
                // Extract channel name if possible
                let author = 'Twitch Streamer';
                const channelMatch = htmlContent.match(/channel_name\s*:\s*['"](.*?)['"]/);
                if (channelMatch && channelMatch[1]) {
                    author = channelMatch[1];
                }
                
                res.json({
                    title: title,
                    author: author,
                    platform: 'twitch'
                });
            } catch (error) {
                console.error('Error fetching Twitch info:', error);
                res.status(500).json({ error: 'Error fetching Twitch clip information' });
            }
        } else if (url.includes('medal.tv')) {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                const htmlContent = response.data;
                
                // Extract title if available
                let title = 'Medal.tv Clip';
                const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/);
                if (titleMatch && titleMatch[1]) {
                    title = titleMatch[1].trim();
                }
                
                // Extract author if available
                let author = 'Medal.tv User';
                const authorMatch = htmlContent.match(/(?:username|displayName|authorName)\s*[:=]\s*['"](.*?)['"]/i);
                if (authorMatch && authorMatch[1]) {
                    author = authorMatch[1];
                }
                
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
        const { currentClipId, sort = 'newest', streamer, getAdjacent } = req.query;
        
        if (!currentClipId || getAdjacent !== 'true') {
            return res.status(400).json({ error: 'Required parameters missing' });
        }
        
        // Find the current clip to get its creation date for sorting
        const currentClip = await Clip.findById(currentClipId);
        if (!currentClip) {
            return res.status(404).json({ error: 'Current clip not found' });
        }
        
        // Build query for filtering - used for both next and prev clip queries
        const baseQuery = {};
        if (streamer) {
            baseQuery.streamer = { $regex: new RegExp(streamer, 'i') };
        }
        
        // Determine sort field and direction based on sort option
        let sortField = 'createdAt';
        let sortDirection = -1; // Default to newest first (descending)
        
        switch (sort) {
            case 'oldest':
                sortField = 'createdAt';
                sortDirection = 1; // Ascending
                break;
            case 'highestUpvotes':
                sortField = 'upvotes';
                sortDirection = -1; // Descending
                break;
            case 'highestDownvotes':
                sortField = 'downvotes';
                sortDirection = -1; // Descending
                break;
            case 'newest':
            default:
                sortField = 'createdAt';
                sortDirection = -1; // Descending
                break;
        }

        console.log(`Finding adjacent clips for ${currentClipId} with sort: ${sort} (${sortField}, direction: ${sortDirection})`);
        console.log(`Current clip ${sortField} value:`, currentClip[sortField]);
        
        // Find previous clip (the one that comes before in the sorted order)
        // If sorting in descending order (newest first), previous means higher value
        // If sorting in ascending order (oldest first), previous means lower value
        const prevClipQuery = { ...baseQuery };
        if (sortDirection === -1) {
            // For descending order, previous clip has a higher value of the sort field
            prevClipQuery[sortField] = { $gt: currentClip[sortField] };
        } else {
            // For ascending order, previous clip has a lower value of the sort field
            prevClipQuery[sortField] = { $lt: currentClip[sortField] };
        }
        
        console.log('Previous clip query:', JSON.stringify(prevClipQuery));
        const prevClip = await Clip.findOne(prevClipQuery)
            .sort({ [sortField]: sortDirection }) // Use the same direction as main sort
            .limit(1);
        
        // Find next clip (the one that comes after in the sorted order)
        // If sorting in descending order (newest first), next means lower value
        // If sorting in ascending order (oldest first), next means higher value
        const nextClipQuery = { ...baseQuery };
        if (sortDirection === -1) {
            // For descending order, next clip has a lower value of the sort field
            nextClipQuery[sortField] = { $lt: currentClip[sortField] };
        } else {
            // For ascending order, next clip has a higher value of the sort field
            nextClipQuery[sortField] = { $gt: currentClip[sortField] };
        }
        
        console.log('Next clip query:', JSON.stringify(nextClipQuery));
        const nextClip = await Clip.findOne(nextClipQuery)
            .sort({ [sortField]: sortDirection === 1 ? 1 : -1 }) // For next, use same direction as main sort
            .limit(1);
        
        console.log(`Found previous clip: ${prevClip?._id || 'none'}, next clip: ${nextClip?._id || 'none'}`);
        
        res.json({
            prevClip,
            nextClip
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
            const outputDir = path.join(__dirname, '..', 'uploads');
            const outputPath = path.join(outputDir, `${uniqueId}.mp4`);
            
            // Ensure the uploads directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
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
                                fileName: `${uniqueId}.mp4`,
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
                            fileName: `${uniqueId}.mp4`,
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
                            fileName: `${uniqueId}.mp4`,
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
                        fileName: `${uniqueId}.mp4`,
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
        const { streamer, submitter, title, link } = req.body;
        console.log("Request body:", { streamer, submitter, title, link });

        let fileUrl;
        let thumbnailUrl;
        let finalTitle = title;
        
        // Case 1: Direct file upload
        if (req.file) {
            const uploadPath = path.join(__dirname, '..', 'uploads', req.file.filename);
            console.log("File uploaded with filename:", req.file.filename);
            
            try {
                // Compress the video file with ffmpeg (same as Discord bot)
                await compressVideo(uploadPath);
                console.log("Video compressed successfully");
            } catch (compressionError) {
                console.error("Error compressing video:", compressionError);
                // Continue with uncompressed video if compression fails
            }

            fileUrl = `https://api.spoekle.com/uploads/${req.file.filename}`;

            // Generate thumbnail
            const thumbnailFilename = `${path.parse(req.file.filename).name}_thumbnail.png`;
            console.log("Generating thumbnail:", thumbnailFilename);

            await new Promise((resolve, reject) => {
                ffmpeg(uploadPath)
                    .screenshots({
                        timestamps: ['00:00:00.001'],
                        filename: thumbnailFilename,
                        folder: path.join(__dirname, '..', 'uploads'),
                        size: '640x360',
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            thumbnailUrl = `https://api.spoekle.com/uploads/${thumbnailFilename}`;
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
                
                // Use the filename for the URL
                const filename = downloadResult.fileName;
                fileUrl = `https://api.spoekle.com/uploads/${filename}`;
                
                // Generate thumbnail for the downloaded file
                const thumbnailFilename = `${path.parse(filename).name}_thumbnail.png`;
                
                await new Promise((resolve, reject) => {
                    ffmpeg(downloadResult.filePath)
                        .screenshots({
                            timestamps: ['00:00:00.001'],
                            filename: thumbnailFilename,
                            folder: path.join(__dirname, '..', 'uploads'),
                            size: '640x360',
                        })
                        .on('end', resolve)
                        .on('error', reject);
                });
                
                thumbnailUrl = `https://api.spoekle.com/uploads/${thumbnailFilename}`;
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
            return res.status(400).json({ error: 'No file or valid link provided' });
        }

        const newClip = new Clip({ 
            url: fileUrl, 
            thumbnail: thumbnailUrl, 
            streamer, 
            submitter, 
            title: finalTitle || title, 
            link 
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
    const { streamer, submitter, title } = req.body;

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

        if (title !== undefined) {
            clip.title = title;
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
                fs.unlinkSync(path.join(__dirname, 'uploads', path.basename(clip.url)));
            } catch (error) {
                console.error("Error removing file:", error.message);
            }
            await clip.remove();

            // Update clip count in config
            await updateClipCount();

            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Clip not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/', authorizeRoles(['admin']), async (req, res) => {
    try {
        await Clip.deleteMany({});
        const files = fs.readdirSync(path.join(__dirname, '..', 'uploads'));
        for (const file of files) {
            try {
                fs.unlinkSync(path.join(__dirname, '..', 'uploads', file));
            } catch (err) {
                console.error(`Error deleting file ${file}:`, err);
            }
        }

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

module.exports = router;