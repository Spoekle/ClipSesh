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

        // Find user with all profile fields - only return if profile is public
        const user = await User.findById(userId)
            .select('username profilePicture roles discordUsername discordId joinDate status bio website socialLinks isPublic lastActive trophies')
            .lean();

        if (!user || user.status !== 'active' || !user.isPublic) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Calculate clips submitted
        let clipsSubmitted = 0;
        if (user.discordId) {
            clipsSubmitted = await Clip.countDocuments({ discordId: user.discordId });
        }

        // Build response
        const publicProfile = {
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture,
            roles: user.roles,
            discordUsername: user.discordUsername,
            joinDate: user.joinDate,
            bio: user.bio,
            website: user.website,
            socialLinks: user.socialLinks,
            lastActive: user.lastActive,
            trophies: user.trophies,
            stats: {
                clipsSubmitted,
                joinDate: user.joinDate
            }
        };

        res.json(publicProfile);
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
        
        // Get user with all profile fields
        const user = await User.findById(userId)
            .select('username email profilePicture roles discordUsername discordId joinDate bio website socialLinks isPublic lastActive trophies status')
            .lean();
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate clips submitted
        let clipsSubmitted = 0;
        if (user.discordId) {
            clipsSubmitted = await Clip.countDocuments({ discordId: user.discordId });
        }

        // Update last active
        await User.findByIdAndUpdate(userId, { lastActive: new Date() });

        const profile = {
            ...user,
            stats: {
                clipsSubmitted,
                joinDate: user.joinDate
            }
        };

        res.json({
            success: true,
            profile
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
        const { bio, website, socialLinks, isPublic } = req.body;

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
            bio: bio || '',
            website: website || '',
            socialLinks: socialLinks || {},
            isPublic: Boolean(isPublic),
            lastActive: new Date()
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('username email profilePicture roles discordUsername discordId joinDate bio website socialLinks isPublic lastActive trophies status');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate clips submitted
        let clipsSubmitted = 0;
        if (updatedUser.discordId) {
            clipsSubmitted = await Clip.countDocuments({ discordId: updatedUser.discordId });
        }

        const profile = {
            ...updatedUser.toObject(),
            stats: {
                clipsSubmitted,
                joinDate: updatedUser.joinDate
            }
        };

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile
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
