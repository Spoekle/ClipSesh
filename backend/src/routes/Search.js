const express = require('express');
const router = express.Router();
const Fuse = require('fuse.js');
const Clip = require('../models/clipModel');
const User = require('../models/userModel');
const searchLimiter = require('./middleware/SearchLimiter');
const { getCurrentSeason } = require('../utils/seasonHelpers');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Unified search API for clips and profiles with seasonal filtering
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Unified search for clips and profiles with seasonal filtering
 *     description: Search across clips and public profiles, prioritizing current season
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, clips, profiles]
 *           default: all
 *         description: Type of content to search
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           enum: [spring, summer, fall, winter]
 *         description: Filter by specific season (optional)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by specific year (optional)
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
 *           default: 12
 *         description: Results per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, upvotes, downvotes, ratio]
 *           default: newest
 *         description: Sort order for clips
 *       - in: query
 *         name: streamer
 *         schema:
 *           type: string
 *         description: Filter clips by streamer name
 *       - in: query
 *         name: submitter
 *         schema:
 *           type: string
 *         description: Filter clips by submitter name
 *     responses:
 *       200:
 *         description: Search results with seasonal organization
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/', searchLimiter, async (req, res) => {
    let { 
        q, 
        type = 'all', 
        season, 
        year, 
        page = 1, 
        limit = 12, 
        sort = 'newest',
        streamer,
        submitter 
    } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Missing search query parameter `q`.' });
    }

    page = parseInt(page);
    limit = parseInt(limit);
    year = year ? parseInt(year) : null;
    const skip = (page - 1) * limit;

    try {
        console.log(`Search request: q=${q}, type=${type}, season=${season}, year=${year}, page=${page}, limit=${limit}, sort=${sort}`);
        
        const currentSeason = getCurrentSeason();
        
        let results = {
            clips: [],
            profiles: [],
            currentSeasonClips: [],
            otherSeasonsClips: {},
            availableSeasons: [],
            currentSeason: currentSeason,
            total: 0,
            totalPages: 0,
            currentPage: page,
            searchType: type
        };

        // Search clips if type is 'all' or 'clips'
        if (type === 'all' || type === 'clips') {
            try {
                // Build clip filter query
                let clipFilter = { };
                
                // Apply streamer filter if specified
                if (streamer) {
                    clipFilter.streamer = { $regex: streamer, $options: 'i' };
                }
                
                // Apply submitter filter if specified
                if (submitter) {
                    clipFilter.submitter = { $regex: submitter, $options: 'i' };
                }
                
                // If specific season/year requested, filter for that
                if (season && year) {
                    clipFilter.season = { $regex: `^${season}$`, $options: 'i' };
                    clipFilter.year = year;
                } else if (season) {
                    clipFilter.season = { $regex: `^${season}$`, $options: 'i' };
                } else if (year) {
                    clipFilter.year = year;
                }
                
                console.log('Clip filter:', clipFilter);
                
                const allClips = await Clip.find(clipFilter).lean();
                console.log(`Found ${allClips.length} clips matching filter criteria`);
                
                const clipOptions = {
                    keys: ['title', 'streamer', 'submitter'],
                    threshold: 0.3,
                    includeScore: true,
                };
                
                const clipFuse = new Fuse(allClips, clipOptions);
                const clipSearchResults = clipFuse.search(q);
                
                let searchedClips = clipSearchResults.map(result => result.item);
                console.log(`Found ${searchedClips.length} clips matching search query`);
                
                // Sort clips based on sort parameter
                searchedClips = searchedClips.sort((a, b) => {
                    switch (sort) {
                        case 'oldest':
                            return new Date(a.createdAt) - new Date(b.createdAt);
                        case 'upvotes':
                            return (b.upvotes || 0) - (a.upvotes || 0);
                        case 'downvotes':
                            return (b.downvotes || 0) - (a.downvotes || 0);
                        case 'ratio':
                            const aRatio = (a.upvotes || 0) / Math.max((a.downvotes || 0), 1);
                            const bRatio = (b.upvotes || 0) / Math.max((b.downvotes || 0), 1);
                            return bRatio - aRatio;
                        case 'newest':
                        default:
                            return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                });
                
                if (season && year) {
                    // If filtering for specific season/year, just return those clips
                    results.clips = searchedClips;
                } else {
                    // Organize clips by season for the new UI
                    const currentSeasonClips = [];
                    const otherSeasonsClips = {};
                    const availableSeasons = new Set();
                    
                    searchedClips.forEach(clip => {
                        const clipSeason = (clip.season || 'unknown').toLowerCase();
                        const clipYear = clip.year || new Date(clip.createdAt).getFullYear();
                        const seasonKey = `${clipSeason}-${clipYear}`;
                        
                        availableSeasons.add(seasonKey);
                        
                        // Check if this clip is from current season
                        if (clipSeason === currentSeason.season.toLowerCase() && clipYear === currentSeason.year) {
                            currentSeasonClips.push(clip);
                        } else {
                            if (!otherSeasonsClips[seasonKey]) {
                                otherSeasonsClips[seasonKey] = {
                                    season: clipSeason,
                                    year: clipYear,
                                    clips: []
                                };
                            }
                            otherSeasonsClips[seasonKey].clips.push(clip);
                        }
                    });
                    
                    // Sort seasons by year/season order (newest first)
                    const sortedSeasons = Array.from(availableSeasons).sort((a, b) => {
                        const [aSeason, aYear] = a.split('-');
                        const [bSeason, bYear] = b.split('-');
                        
                        if (aYear !== bYear) {
                            return parseInt(bYear) - parseInt(aYear);
                        }
                        
                        const seasonOrder = { 'winter': 0, 'spring': 1, 'summer': 2, 'fall': 3 };
                        return (seasonOrder[bSeason] || 0) - (seasonOrder[aSeason] || 0);
                    });
                    
                    results.currentSeasonClips = currentSeasonClips;
                    results.otherSeasonsClips = otherSeasonsClips;
                    results.availableSeasons = sortedSeasons;
                    results.clips = searchedClips; // For backward compatibility
                }
                
                console.log(`Organized clips: ${results.currentSeasonClips?.length || 0} current season, ${Object.keys(results.otherSeasonsClips || {}).length} other seasons`);
            } catch (error) {
                console.error('Error searching clips:', error);
            }
        }

        // Search profiles if type is 'all' or 'profiles'
        if (type === 'all' || type === 'profiles') {
            try {
                // Find users by username, discordUsername, or bio
                const userQuery = {
                    $or: [
                        { username: { $regex: q, $options: 'i' } },
                        { discordUsername: { $regex: q, $options: 'i' } },
                        { 'profile.bio': { $regex: q, $options: 'i' } }
                    ],
                    status: 'active',
                    'profile.isPublic': true
                };

                const users = await User.find(userQuery)
                    .select('_id username profilePicture roles discordUsername discordId createdAt profile joinDate')
                    .lean();

                console.log(`Found ${users.length} users matching search criteria`);

                // Calculate clips submitted for each user
                const profilesWithStats = await Promise.all(
                    users.map(async (user) => {
                        let clipsSubmitted = 0;
                        
                        // Count clips submitted by this user's discordId
                        if (user.discordId) {
                            try {
                                clipsSubmitted = await Clip.countDocuments({
                                    discordSubmitterId: user.discordId
                                });
                            } catch (clipCountError) {
                                console.error('Error counting clips for user:', user._id, clipCountError);
                                clipsSubmitted = 0;
                            }
                        }

                        return {
                            _id: user._id,
                            username: user.username,
                            profilePicture: user.profilePicture,
                            roles: user.roles,
                            discordUsername: user.discordUsername,
                            bio: user.profile?.bio || '',
                            website: user.profile?.socialLinks?.website || '',
                            socialLinks: user.profile?.socialLinks || {},
                            joinDate: user.joinDate || user.createdAt,
                            lastActive: user.profile?.lastActive || user.createdAt,
                            isPublic: user.profile?.isPublic !== false,
                            stats: {
                                clipsSubmitted,
                                joinDate: user.joinDate || user.createdAt
                            }
                        };
                    })
                );

                results.profiles = profilesWithStats
                    .sort((a, b) => new Date(b.lastActive || b.joinDate) - new Date(a.lastActive || a.joinDate));

                console.log(`Found ${results.profiles.length} matching profiles`);
            } catch (error) {
                console.error('Error searching profiles:', error);
            }
        }

        // Calculate totals
        const totalClips = results.clips?.length || 0;
        const totalProfiles = results.profiles?.length || 0;
        results.total = totalClips + totalProfiles;
        results.totalPages = Math.ceil(results.total / limit);

        results.currentSeason = {
            season: currentSeason.season.charAt(0).toUpperCase() + currentSeason.season.slice(1),
            year: currentSeason.year
        };

        if (type === 'all') {
            // For combined search, paginate profiles only (clips are organized by season)
            const startIndex = skip;
            const endIndex = startIndex + limit;
            results.profiles = results.profiles.slice(startIndex, endIndex);
        } else if (type === 'clips') {
            // For clips-only search, apply normal pagination
            results.clips = results.clips.slice(skip, skip + limit);
            results.profiles = [];
        } else if (type === 'profiles') {
            // For profiles-only search, paginate normally
            results.profiles = results.profiles.slice(skip, skip + limit);
            results.clips = [];
            results.currentSeasonClips = [];
            results.otherSeasonsClips = {};
        }

        res.json(results);
    } catch (error) {
        console.error('Error in unified search:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
