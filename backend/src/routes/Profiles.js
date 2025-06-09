const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Clip = require('../models/clipModel');
const auth = require('./middleware/VerifyToken');

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: User profile management API
 */

/**
 * @swagger
 * /api/profiles/public/{userId}:
 *   get:
 *     summary: Get public profile by user ID
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public profile data
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/public/:userId', async (req, res) => {
    try {        
        const { userId } = req.params;        
        // Find user - get everything except password
        const user = await User.findById(userId)
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.status !== 'active') {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Check if profile is public - default to true if profile object doesn't exist
        const isPublic = user.profile?.isPublic !== false; // Default to true if undefined
        if (!isPublic) {
            return res.status(404).json({ error: 'Profile is private' });
        }

        // Calculate clips submitted
        let clipsSubmitted = 0;
        if (user.discordId) {
            clipsSubmitted = await Clip.countDocuments({ discordId: user.discordId });
        }        // Add stats to user object
        const userWithStats = {
            ...user,
            stats: {
                clipsSubmitted,
                joinDate: user.createdAt
            }
        };

        res.json(userWithStats);
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/profiles/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's profile data
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/me', auth, async (req, res) => {
    try {
        const userId = req.user.id;        
        // Get user - everything except password
        const user = await User.findById(userId)
            .select('-password')
            .lean();
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate clips submitted
        let clipsSubmitted = 0;
        if (user.discordId) {
            clipsSubmitted = await Clip.countDocuments({ discordId: user.discordId });
        }        // Update last active
        await User.findByIdAndUpdate(userId, { 'profile.lastActive': new Date() });        
        // Add stats to user object
        const userWithStats = {
            ...user,
            stats: {
                clipsSubmitted,
                joinDate: user.createdAt
            }
        };

        res.json({
            success: true,
            profile: userWithStats
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @swagger
 * /api/profiles/me:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               website:
 *                 type: string
 *               socialLinks:
 *                 type: object
 *               vrheadset:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       500:
 *         description: Internal Server Error
 */
router.put('/me', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, website, socialLinks, vrheadset, isPublic } = req.body;

        // Validate URLs if provided
        if (website && !isValidUrl(website)) {
            return res.status(400).json({ error: 'Invalid website URL' });
        }

        if (socialLinks) {
            for (const [platform, url] of Object.entries(socialLinks)) {
                if (url && !isValidUrl(url)) {
                    return res.status(400).json({ error: `Invalid URL for ${platform}` });
                }
            }
        }        
        const updateData = {
            'profile.bio': bio || '',
            'profile.website': website || '',
            'profile.socialLinks': socialLinks || {},
            'profile.vrheadset': vrheadset || 'Other',
            'profile.isPublic': Boolean(isPublic),
            'profile.lastActive': new Date()
        };
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate clips submitted
        let clipsSubmitted = 0;
        if (updatedUser.discordId) {
            clipsSubmitted = await Clip.countDocuments({ discordId: updatedUser.discordId });
        }        
        // Add stats to user object
        const userWithStats = {
            ...updatedUser.toObject(),
            stats: {
                clipsSubmitted,
                joinDate: updatedUser.createdAt
            }
        };

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: userWithStats
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Helper function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

module.exports = router;
