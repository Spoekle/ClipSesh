const express = require('express');
const router = express.Router();

const Rating = require('../models/ratingModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');

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
            rating: rating === 'deny' ? 'deny' : parseInt(rating),
            count: ratingDoc.ratings[rating].length,
            users: ratingDoc.ratings[rating]
        }));

        const totalRatings = ratingCounts.reduce((acc, curr) => acc + curr.count, 0);

        res.json({
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
                ratingDoc.ratings[rating].push({ userId, username });
            }
        } else if (deny !== undefined && deny) {
            const alreadyDenied = ratingDoc.ratings['deny'].some(r => r.userId.equals(userId));

            ['1', '2', '3', '4', 'deny'].forEach(key => {
                ratingDoc.ratings[key] = ratingDoc.ratings[key].filter(r => !r.userId.equals(userId));
            });

            if (alreadyDenied) {
                message = 'Deny removed successfully';
            } else {
                ratingDoc.ratings['deny'].push({ userId, username });
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