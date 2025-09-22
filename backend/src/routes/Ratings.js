const express = require('express');
const router = express.Router();

const Rating = require('../models/ratingModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');

// Get all ratings sorted by user with season/year filtering
router.get('/', authorizeRoles(['admin']), async (req, res) => {
    try {
        const { season, year } = req.query;
        
        // Get all ratings to process
        const ratings = await Rating.find();
        
        // Try to fetch clips for additional metadata, but don't depend on them
        let clipsMap = {};
        try {
            const clips = await require('../models/clipModel').find({}, { _id: 1, createdAt: 1 });
            clips.forEach(clip => {
                clipsMap[clip._id.toString()] = clip;
            });
        } catch (error) {
            console.log('Clips might be deleted after season end, continuing with ratings only');
        }
        
        // Create a map to organize ratings by user
        const userRatings = {};
        
        // Process each rating
        ratings.forEach(rating => {
            const clipId = rating.clipId.toString();
            const clip = clipsMap[clipId];
            
            // Extract season and year from rating or clip creation date
            // Default to the rating document's createdAt if we don't have clip info
            const ratingCreatedDate = new Date(rating.createdAt);
            
            let clipDate, clipYear, clipMonth, clipDay;
            
            if (clip && clip.createdAt) {
                // If clip exists, use its creation date for season/year determination
                clipDate = new Date(clip.createdAt);
            } else {
                // If clip doesn't exist (deleted after season), use the rating creation date
                clipDate = ratingCreatedDate;
            }
            
            clipYear = clipDate.getFullYear().toString();
            clipMonth = clipDate.getMonth(); // 0-based (0-11)
            clipDay = clipDate.getDate(); // 1-31
            
            // Determine season based on astronomical seasons (starting on the 21st of March, June, Sept, Dec)
            let clipSeason;
            if ((clipMonth === 2 && clipDay >= 21) || (clipMonth > 2 && clipMonth < 5) || (clipMonth === 5 && clipDay < 21)) {
                clipSeason = 'spring'; // March 21 - June 20
            } else if ((clipMonth === 5 && clipDay >= 21) || (clipMonth > 5 && clipMonth < 8) || (clipMonth === 8 && clipDay < 21)) {
                clipSeason = 'summer'; // June 21 - Sept 20
            } else if ((clipMonth === 8 && clipDay >= 21) || (clipMonth > 8 && clipMonth < 11) || (clipMonth === 11 && clipDay < 21)) {
                clipSeason = 'fall'; // Sept 21 - Dec 20
            } else {
                clipSeason = 'winter'; // Dec 21 - March 20
            }
            
            // Apply filters if provided
            if ((season && clipSeason !== season) || 
                (year && clipYear !== year)) {
                return;
            }
            
            // Process each rating category
            Object.keys(rating.ratings).forEach(ratingKey => {
                // Process each user who rated in this category
                rating.ratings[ratingKey].forEach(userRating => {
                    const userId = userRating.userId.toString();
                    const username = userRating.username;
                    
                    // Initialize user entry if it doesn't exist
                    if (!userRatings[userId]) {
                        userRatings[userId] = {
                            userId,
                            username,
                            totalRatings: 0,
                            ratings: []
                        };
                    }
                    
                    // For older ratings without timestamp, use the rating document's created date
                    // This preserves the historical nature of the data
                    const timestamp = userRating.timestamp || ratingCreatedDate;
                    
                    // Add this rating to user's records
                    userRatings[userId].ratings.push({
                        clipId: rating.clipId,
                        rating: ratingKey === 'deny' ? 'deny' : parseInt(ratingKey),
                        timestamp: timestamp,
                        clipMetadata: {
                            season: clipSeason,
                            year: clipYear
                        }
                    });
                    
                    userRatings[userId].totalRatings++;
                });
            });
        });
        
        // Convert to array and sort by total ratings (most active users first)
        const sortedUserRatings = Object.values(userRatings)
            .sort((a, b) => b.totalRatings - a.totalRatings);
        
        res.json(sortedUserRatings);
    } catch (error) {
        console.error('Error fetching user ratings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Helper function to extract metadata from clipId
function extractClipMetadata(clipId) {
    // Ensure clipId is a string before attempting to split
    if (typeof clipId !== 'string') {
        console.warn(`Invalid clipId format: ${clipId} (type: ${typeof clipId})`);
        return {
            season: null,
            year: null
        };
    }
    
    // Extract season and year from clipId
    try {
        const parts = clipId.split('-');
        return {
            season: parts.length > 0 ? parts[0] : null,
            year: parts.length > 1 ? parts[1] : null,
        };
    } catch (error) {
        console.error(`Error extracting metadata from clipId ${clipId}:`, error);
        return {
            season: null,
            year: null
        };
    }
}

// Get ratings for the current user
router.get('/my-ratings', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    try {
        const userId = req.user.id;
        const { season, year, startDate, endDate } = req.query;
        
        // Get all ratings
        const ratings = await Rating.find();
        
        // Try to fetch clips for additional metadata, but don't depend on them
        let clipsMap = {};
        try {
            const clips = await require('../models/clipModel').find({}, { _id: 1, createdAt: 1 });
            clips.forEach(clip => {
                clipsMap[clip._id.toString()] = clip;
            });
        } catch (error) {
            console.log('Clips might be deleted after season end, continuing with ratings only');
        }
        
        // Filter ratings for this specific user
        const userRatings = [];
        
        // Process each rating
        ratings.forEach(rating => {
            const clipId = rating.clipId.toString();
            const clip = clipsMap[clipId];
            
            // Extract season and year from rating or clip creation date
            const ratingCreatedDate = new Date(rating.createdAt);
            
            let clipDate, clipYear, clipMonth, clipDay;
            
            if (clip && clip.createdAt) {
                // If clip exists, use its creation date
                clipDate = new Date(clip.createdAt);
            } else {
                // If clip doesn't exist (deleted after season), use the rating creation date
                clipDate = ratingCreatedDate;
            }
            
            clipYear = clipDate.getFullYear().toString();
            clipMonth = clipDate.getMonth(); // 0-based (0-11)
            clipDay = clipDate.getDate(); // 1-31
            
            // Determine season based on astronomical seasons (starting on the 21st of March, June, Sept, Dec)
            let clipSeason;
            if ((clipMonth === 2 && clipDay >= 21) || (clipMonth > 2 && clipMonth < 5) || (clipMonth === 5 && clipDay < 21)) {
                clipSeason = 'spring'; // March 21 - June 20
            } else if ((clipMonth === 5 && clipDay >= 21) || (clipMonth > 5 && clipMonth < 8) || (clipMonth === 8 && clipDay < 21)) {
                clipSeason = 'summer'; // June 21 - Sept 20
            } else if ((clipMonth === 8 && clipDay >= 21) || (clipMonth > 8 && clipMonth < 11) || (clipMonth === 11 && clipDay < 21)) {
                clipSeason = 'fall'; // Sept 21 - Dec 20
            } else {
                clipSeason = 'winter'; // Dec 21 - March 20
            }
            
            // Process each rating category
            Object.keys(rating.ratings).forEach(ratingKey => {
                // Find if this user has rated in this category
                const userRating = rating.ratings[ratingKey].find(r => 
                    r.userId.toString() === userId.toString()
                );
                
                if (userRating) {
                    // Apply season/year filters if provided
                    if ((season && clipSeason !== season) || 
                        (year && clipYear !== year)) {
                        return;
                    }
                    
                    // Use the actual timestamp from the user rating or the rating document's creation date
                    const timestamp = userRating.timestamp || ratingCreatedDate;
                    
                    // Apply date range filters if provided
                    if (startDate || endDate) {
                        const ratingDate = new Date(timestamp);
                        
                        if (startDate) {
                            const start = new Date(startDate);
                            start.setHours(0, 0, 0, 0);
                            if (ratingDate < start) return;
                        }
                        
                        if (endDate) {
                            const end = new Date(endDate);
                            end.setHours(23, 59, 59, 999);
                            if (ratingDate > end) return;
                        }
                    }
                    
                    userRatings.push({
                        clipId: rating.clipId,
                        rating: ratingKey === 'deny' ? 'deny' : parseInt(ratingKey),
                        timestamp: timestamp,
                        clipMetadata: {
                            season: clipSeason,
                            year: clipYear
                        }
                    });
                }
            });
        });
        
        // Calculate statistics
        const statistics = {
            totalRatings: userRatings.length,
            ratingBreakdown: {
                '1': userRatings.filter(r => r.rating === 1).length,
                '2': userRatings.filter(r => r.rating === 2).length,
                '3': userRatings.filter(r => r.rating === 3).length,
                '4': userRatings.filter(r => r.rating === 4).length,
                'deny': userRatings.filter(r => r.rating === 'deny').length
            }
        };
        
        res.json({
            statistics,
            ratings: userRatings
        });
    } catch (error) {
        console.error('Error fetching user ratings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get activity data for all users (for admin activity tracking)
router.get('/activity', authorizeRoles(['admin']), async (req, res) => {
    try {
        const { season, year } = req.query;
        
        // Get all ratings to process
        const ratings = await Rating.find();
        
        // Try to fetch clips for additional metadata, but don't depend on them
        let clipsMap = {};
        try {
            const clips = await require('../models/clipModel').find({}, { _id: 1, createdAt: 1 });
            clips.forEach(clip => {
                clipsMap[clip._id.toString()] = clip;
            });
        } catch (error) {
            console.log('Clips might be deleted after season end, continuing with ratings only');
        }
        
        // Create a comprehensive list of all user activities
        const allActivities = [];
        
        // Process each rating
        ratings.forEach(rating => {
            const clipId = rating.clipId.toString();
            const clip = clipsMap[clipId];
            
            // Extract season and year from rating or clip creation date
            const ratingCreatedDate = new Date(rating.createdAt);
            
            let clipDate, clipYear, clipMonth, clipDay;
            
            if (clip && clip.createdAt) {
                // If clip exists, use its creation date for season/year determination
                clipDate = new Date(clip.createdAt);
            } else {
                // If clip doesn't exist (deleted after season), use the rating creation date
                clipDate = ratingCreatedDate;
            }
            
            clipYear = clipDate.getFullYear().toString();
            clipMonth = clipDate.getMonth(); // 0-based (0-11)
            clipDay = clipDate.getDate(); // 1-31
            
            // Determine season based on astronomical seasons (starting on the 21st of March, June, Sept, Dec)
            let clipSeason;
            if ((clipMonth === 2 && clipDay >= 21) || (clipMonth > 2 && clipMonth < 5) || (clipMonth === 5 && clipDay < 21)) {
                clipSeason = 'spring'; // March 21 - June 20
            } else if ((clipMonth === 5 && clipDay >= 21) || (clipMonth > 5 && clipMonth < 8) || (clipMonth === 8 && clipDay < 21)) {
                clipSeason = 'summer'; // June 21 - Sept 20
            } else if ((clipMonth === 8 && clipDay >= 21) || (clipMonth > 8 && clipMonth < 11) || (clipMonth === 11 && clipDay < 21)) {
                clipSeason = 'fall'; // Sept 21 - Dec 20
            } else {
                clipSeason = 'winter'; // Dec 21 - March 20
            }
            
            // Apply filters if provided
            if ((season && clipSeason !== season) || 
                (year && clipYear !== year)) {
                return;
            }
            
            // Process each rating category
            Object.keys(rating.ratings).forEach(ratingKey => {
                // Process each user who rated in this category
                rating.ratings[ratingKey].forEach(userRating => {
                    const userId = userRating.userId.toString();
                    const username = userRating.username;
                    
                    // Use the actual timestamp from the user rating or the rating document's creation date
                    const timestamp = userRating.timestamp || ratingCreatedDate;
                    
                    // Add this individual rating to the activities list
                    allActivities.push({
                        userId,
                        username,
                        clipId: rating.clipId,
                        rating: ratingKey === 'deny' ? 'deny' : parseInt(ratingKey),
                        timestamp: timestamp,
                        clipMetadata: {
                            season: clipSeason,
                            year: clipYear
                        }
                    });
                });
            });
        });
        
        // Group activities by user
        const userActivities = {};
        allActivities.forEach(activity => {
            if (!userActivities[activity.userId]) {
                userActivities[activity.userId] = {
                    userId: activity.userId,
                    username: activity.username,
                    totalRatings: 0,
                    ratings: []
                };
            }
            userActivities[activity.userId].ratings.push({
                clipId: activity.clipId,
                rating: activity.rating,
                timestamp: activity.timestamp,
                clipMetadata: activity.clipMetadata
            });
            userActivities[activity.userId].totalRatings++;
        });
        
        // Convert to array and sort by total ratings (most active users first)
        const sortedUserActivities = Object.values(userActivities)
            .sort((a, b) => b.totalRatings - a.totalRatings);
        
        res.json(sortedUserActivities);
    } catch (error) {
        console.error('Error fetching activity data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API endpoint to handle rating updates
router.get('/:id', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    const clipId = req.params.id;

    try {
        let ratingDoc = await Rating.findOne({ clipId });

        if (!ratingDoc) {
            ratingDoc = new Rating({
                clipId,
                ratings: {
                    '1': [],
                    '2': [],
                    '3': [],
                    '4': [],
                    'deny': []
                }
            });
            await ratingDoc.save();
        }

        const ratingCounts = Object.keys(ratingDoc.ratings).map(rating => ({
            rating: rating, // Keep as string for consistency
            count: ratingDoc.ratings[rating].length,
            users: ratingDoc.ratings[rating]
        }));

        const totalRatings = ratingCounts.reduce((acc, curr) => acc + curr.count, 0);

        res.json({
            clipId: clipId,
            totalRatings,
            ratingCounts
        });

    } catch (error) {
        console.error(`Error fetching ratings for clip ${clipId}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/:id', authorizeRoles(['clipteam', 'admin']), async (req, res) => {
    const { rating, deny } = req.body;
    const userId = req.user.id;
    const username = req.user.username;
    const clipId = req.params.id;

    if ((rating && (rating < 1 || rating > 4)) || (deny !== undefined && typeof deny !== 'boolean')) {
        return res.status(400).send('Invalid parameters');
    }

    try {
        let ratingDoc = await Rating.findOne({ clipId });

        if (!ratingDoc) {
            ratingDoc = new Rating({ clipId, ratings: { '1': [], '2': [], '3': [], '4': [], 'deny': [] } });
        }

        let message = 'Rating updated successfully';

        if (rating !== undefined) {
            const alreadyRated = ratingDoc.ratings[rating].some(r => r.userId.equals(userId));

            ['1', '2', '3', '4', 'deny'].forEach(key => {
                ratingDoc.ratings[key] = ratingDoc.ratings[key].filter(r => !r.userId.equals(userId));
            });

            if (alreadyRated) {
                message = 'Rating removed successfully';
            } else {
                // Only add timestamp for new ratings, don't modify existing ratings' structure
                // This ensures backward compatibility with older ratings
                ratingDoc.ratings[rating].push({ 
                    userId, 
                    username,
                    timestamp: new Date() // Only new ratings get timestamps
                });
            }
        } else if (deny !== undefined && deny) {
            const alreadyDenied = ratingDoc.ratings['deny'].some(r => r.userId.equals(userId));

            ['1', '2', '3', '4', 'deny'].forEach(key => {
                ratingDoc.ratings[key] = ratingDoc.ratings[key].filter(r => !r.userId.equals(userId));
            });

            if (alreadyDenied) {
                message = 'Deny removed successfully';
            } else {
                // Only add timestamp for new deny ratings
                ratingDoc.ratings['deny'].push({ 
                    userId, 
                    username,
                    timestamp: new Date() // Only new ratings get timestamps
                });
            }
        }

        await ratingDoc.save();

        res.send(message);
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;