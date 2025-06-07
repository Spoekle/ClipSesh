const express = require('express');
const router = express.Router();
const Fuse = require('fuse.js');
const Clip = require('../models/clipModel');
const User = require('../models/userModel');
const searchLimiter = require('./middleware/SearchLimiter');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Unified search API for clips and profiles
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Unified search for clips and profiles
 *     description: Search across clips and public profiles
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
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Internal Server Error
 */
router.get('/', searchLimiter, async (req, res) => {
    let { q, type = 'all', page = 1, limit = 12 } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ error: 'Missing search query parameter `q`.' });
    }

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    try {
        console.log(`Unified search request: q=${q}, type=${type}, page=${page}, limit=${limit}`);
        
        let results = {
            clips: [],
            profiles: [],
            total: 0,
            totalPages: 0,
            currentPage: page,
            searchType: type
        };

        // Search clips if type is 'all' or 'clips'
        if (type === 'all' || type === 'clips') {
            try {
                const allClips = await Clip.find({}).lean();
                
                const clipOptions = {
                    keys: ['title', 'streamer', 'submitter'],
                    threshold: 0.3,
                    includeScore: true,
                };
                
                const clipFuse = new Fuse(allClips, clipOptions);
                const clipSearchResults = clipFuse.search(q);
                
                // Sort clips by newest by default
                const sortedClips = clipSearchResults
                    .map(result => result.item)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                results.clips = sortedClips;
                console.log(`Found ${sortedClips.length} matching clips`);
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
                        { bio: { $regex: q, $options: 'i' } }
                    ],
                    status: 'active',
                    isPublic: true
                };

                const users = await User.find(userQuery)
                    .select('_id username profilePicture roles discordUsername discordId createdAt bio website socialLinks isPublic lastActive joinDate')
                    .lean();

                // Calculate clips submitted for each user
                const profilesWithStats = await Promise.all(
                    users.map(async (user) => {
                        let clipsSubmitted = 0;
                        
                        // Count clips submitted by this user's discordId
                        if (user.discordId) {
                            try {
                                clipsSubmitted = await Clip.countDocuments({
                                    discordId: user.discordId
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
                            bio: user.bio,
                            website: user.website,
                            socialLinks: user.socialLinks,
                            joinDate: user.joinDate || user.createdAt,
                            lastActive: user.lastActive,
                            isPublic: user.isPublic,
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

        results.total = results.clips.length + results.profiles.length;
        results.totalPages = Math.ceil(results.total / limit);

        // Apply pagination to combined results
        if (type === 'all') {
            // For combined search, interleave results and paginate
            const combinedResults = [];
            const maxResults = Math.max(results.clips.length, results.profiles.length);
            
            for (let i = 0; i < maxResults; i++) {
                if (i < results.clips.length) {
                    combinedResults.push({ type: 'clip', data: results.clips[i] });
                }
                if (i < results.profiles.length) {
                    combinedResults.push({ type: 'profile', data: results.profiles[i] });
                }
            }

            const startIndex = skip;
            const endIndex = startIndex + limit;
            const paginatedResults = combinedResults.slice(startIndex, endIndex);

            results.clips = paginatedResults.filter(r => r.type === 'clip').map(r => r.data);
            results.profiles = paginatedResults.filter(r => r.type === 'profile').map(r => r.data);
        } else {
            // For specific type searches, paginate normally
            if (type === 'clips') {
                results.clips = results.clips.slice(skip, skip + limit);
                results.profiles = [];
            } else if (type === 'profiles') {
                results.profiles = results.profiles.slice(skip, skip + limit);
                results.clips = [];
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Error in unified search:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
