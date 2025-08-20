const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const { AdminConfig, PublicConfig } = require('../models/configModel');
const Report = require('../models/reportModel');
const ReportMessage = require('../models/reportMessageModel');
const Notification = require('../models/notificationModel');
const Clip = require('../models/clipModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');
const botToken = process.env.DISCORD_BOT_TOKEN;

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin API endpoints for user and system management
 */

/**
 * @swagger
 * /api/admin/create-user:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with specified roles (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username for the new account
 *                 example: newuser123
 *               password:
 *                 type: string
 *                 description: Password for the new account
 *                 format: password
 *                 example: securePassword123!
 *               roles:
 *                 type: array
 *                 description: User roles (defaults to ['user'] if not specified)
 *                 items:
 *                   type: string
 *                   enum: [user, admin, clipteam, editor, uploader]
 *                 example: [user, clipteam]
 *               email:
 *                 type: string
 *                 description: User email (optional)
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *       401:
 *         description: Unauthorized - Authentication required or insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/create-user', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { username, password, roles, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      username,
      password: hashedPassword, 
      roles: roles || ['user'],
      email,
      status: 'active',
      createdAt: new Date()
    });
    await newUser.save();
    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update user details including username, password, roles, etc. (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ID of the user to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username
 *                 example: updatedUsername
 *               password:
 *                 type: string
 *                 description: New password (will be hashed)
 *                 format: password
 *                 example: newSecurePassword123!
 *               roles:
 *                 type: array
 *                 description: Updated user roles
 *                 items:
 *                   type: string
 *                   enum: [user, admin, clipteam, editor, uploader]
 *                 example: [user, editor]
 *               email:
 *                 type: string
 *                 description: User email
 *                 format: email
 *                 example: updated@example.com
 *               status:
 *                 type: string
 *                 description: User account status
 *                 enum: [active, disabled]
 *                 example: active
 *               profilePicture:
 *                 type: string
 *                 description: URL to user profile picture
 *                 example: https://example.com/images/profile.jpg
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *       401:
 *         description: Unauthorized - Authentication required or insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/users/:id', authorizeRoles(['admin']), async (req, res) => {
  const { username, password, roles, email, profilePicture, status } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username) user.username = username;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (roles) user.roles = roles;
    if (email !== undefined) user.email = email;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (status) user.status = status;

    // Update lastModified timestamp
    user.lastModified = new Date();

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     description: Retrieve detailed information about a specific user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 612c1d9f5e123a001234abcd
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [user, clipteam]
 *                 status:
 *                   type: string
 *                   example: active
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-01-15T12:00:00Z
 *       401:
 *         description: Unauthorized - Authentication required or insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/users/:id', authorizeRoles(['admin']), async (req, res) => {
  try {    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Flatten profile data for frontend compatibility
    const userObj = user.toObject();
    const flattenedUser = {
      ...userObj,
      bio: userObj.profile?.bio || '',
      website: userObj.profile?.socialLinks?.website || '',
      socialLinks: userObj.profile?.socialLinks || {},
      isPublic: userObj.profile?.isPublic !== false,
      lastActive: userObj.profile?.lastActive || userObj.createdAt,
      trophies: userObj.profile?.trophies || [],
    };
    
    res.json(flattenedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with optional filtering
 *     description: Retrieve a list of all users with optional role filtering (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter users by role (e.g. "admin", "clipteam")
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, disabled]
 *         description: Filter users by status
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   roles:
 *                     type: array
 *                     items:
 *                       type: string
 *                   status:
 *                     type: string
 *       401:
 *         description: Unauthorized - Authentication required or insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/users', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { role, status } = req.query;
    let query = {};
    
    if (role) {
      query.roles = role;
    }
    
    if (status) {
      query.status = status;
    }
      const users = await User.find(query).select('-password');
    
    // Flatten profile data for frontend compatibility
    const flattenedUsers = users.map(user => {
      const userObj = user.toObject();
      return {
        ...userObj,
        bio: userObj.profile?.bio || '',
        website: userObj.profile?.socialLinks?.website || '',
        socialLinks: userObj.profile?.socialLinks || {},
        isPublic: userObj.profile?.isPublic !== false,
        lastActive: userObj.profile?.lastActive || userObj.createdAt,
        trophies: userObj.profile?.trophies || [],
      };
    });
    
    res.json(flattenedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/config:
 *   get:
 *     summary: Get admin configuration
 *     description: Retrieve system configuration parameters
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 admin:
 *                   type: object
 *                   properties:
 *                     denyThreshold:
 *                       type: number
 *                       description: Number of deny votes needed to reject a clip
 *                     clipChannelIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Discord channel IDs for clip collection
 *                 public:
 *                   type: object
 *                   properties:
 *                     latestVideoLink:
 *                       type: string
 *                       description: Link to the latest video to show on homepage
 *       500:
 *         description: Internal server error
 */
router.get('/config', authorizeRoles(['admin']), async (req, res) => {
  try {
    // Find or create configs
    let adminConfig = await AdminConfig.findOne();
    let publicConfig = await PublicConfig.findOne();
    
    if (!adminConfig) {
      adminConfig = new AdminConfig();
      await adminConfig.save();
    }
    
    if (!publicConfig) {
      publicConfig = new PublicConfig();
      await publicConfig.save();
    }
    
    // For backward compatibility, include the admin config fields at the top level
    // as well as in the structured format
    res.json([{
      _id: adminConfig._id,
      denyThreshold: adminConfig.denyThreshold,
      latestVideoLink: publicConfig.latestVideoLink,
      // Include the structured format as well
      admin: adminConfig,
      public: publicConfig
    }]);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/config:
 *   put:
 *     summary: Update admin configuration
 *     description: Update system configuration including private and public settings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               denyThreshold:
 *                 type: number
 *               latestVideoLink:
 *                 type: string
 *               admin:
 *                 type: object
 *                 properties:
 *                   denyThreshold:
 *                     type: number
 *                   clipChannelIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   backendUrl:
 *                     type: string
 *                   discordBotToken:
 *                     type: string
 *               public:
 *                 type: object
 *                 properties:
 *                   latestVideoLink:
 *                     type: string
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       401:
 *         description: Unauthorized - Authentication required or insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.put('/config', authorizeRoles(['admin']), async (req, res) => {
  try {
    // Support both new structured format and legacy flat format
    const { denyThreshold, latestVideoLink, admin = {}, public = {} } = req.body;
    
    // Find or create configs
    let adminConfig = await AdminConfig.findOne();
    let publicConfig = await PublicConfig.findOne();
    
    if (!adminConfig) {
      adminConfig = new AdminConfig();
    }
    
    if (!publicConfig) {
      publicConfig = new PublicConfig();
    }
    
    // Update admin config - handle both structured and flat formats
    if (denyThreshold !== undefined) {
      adminConfig.denyThreshold = denyThreshold;
    }
    
    // Update public config - handle both structured and flat formats
    if (latestVideoLink !== undefined) {
      publicConfig.latestVideoLink = latestVideoLink;
    }
    
    // Update admin config from structured format
    if (admin) {
      if (admin.denyThreshold !== undefined) adminConfig.denyThreshold = admin.denyThreshold;
      if (admin.clipChannelIds !== undefined) adminConfig.clipChannelIds = admin.clipChannelIds;
      if (admin.backendUrl !== undefined) adminConfig.backendUrl = admin.backendUrl;
      if (admin.discordBotToken !== undefined) adminConfig.discordBotToken = admin.discordBotToken;
    }
    
    // Update public config from structured format
    if (public) {
      if (public.latestVideoLink !== undefined) publicConfig.latestVideoLink = public.latestVideoLink;
    }
    
    // Save both configs
    await Promise.all([adminConfig.save(), publicConfig.save()]);
    
    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin statistics
 *     description: Retrieve system-wide statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userCount:
 *                   type: number
 *                   description: Total number of users
 *                   example: 150
 *                 activeUserCount:
 *                   type: number
 *                   description: Number of active users
 *                   example: 130
 *                 clipCount:
 *                   type: number
 *                   description: Total number of clips
 *                   example: 500
 *                 ratedClipsCount:
 *                   type: number
 *                   description: Number of clips that have been rated
 *                   example: 350
 *                 deniedClipsCount:
 *                   type: number
 *                   description: Number of clips that have been denied
 *                   example: 25
 *       401:
 *         description: Unauthorized - Authentication required or insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/stats', authorizeRoles(['admin']), async (req, res) => {
  try {
    // This endpoint would typically gather stats from different collections
    // For now, let's return a placeholder
    const userCount = await User.countDocuments();
    const activeUserCount = await User.countDocuments({ status: 'active' });
    
    // You would implement the actual statistics gathering here
    // based on your application's data model
    
    res.json({
      userCount,
      activeUserCount,
      clipCount: 0, // Placeholder - implement actual count
      ratedClipsCount: 0, // Placeholder - implement actual count
      deniedClipsCount: 0 // Placeholder - implement actual count
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/trophies:
 *   post:
 *     summary: Award a trophy to a user
 *     description: Add a trophy to a user's profile (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to award the trophy to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trophyName
 *               - description
 *               - season
 *               - year
 *             properties:
 *               trophyName:
 *                 type: string
 *                 description: Name of the trophy
 *                 example: "Best Clips of the Month"
 *               description:
 *                 type: string
 *                 description: Description of the trophy achievement
 *                 example: "Outstanding performance in January 2024"
 *               season:
 *                 type: string
 *                 description: Season when the trophy was earned
 *                 example: "Winter"
 *               year:
 *                 type: number
 *                 description: Year when the trophy was earned
 *                 example: 2024
 *     responses:
 *       200:
 *         description: Trophy awarded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Trophy awarded successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request or user not found
 *       401:
 *         description: Unauthorized - Admin role required
 *       500:
 *         description: Internal server error
 */
router.post('/users/:userId/trophies', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { trophyName, description, season, year } = req.body;

    // Validate required fields
    if (!trophyName || !description || !season || !year) {
      return res.status(400).json({
        success: false,
        message: 'Trophy name, description, season, and year are required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }    // Create the trophy object
    const trophy = {
      trophyName,
      description,
      dateEarned: `${season} ${year}`
    };

    // Ensure user has profile object
    if (!user.profile) {
      user.profile = {};
    }
    
    // Ensure user has trophies array
    if (!user.profile.trophies) {
      user.profile.trophies = [];
    }    // Add trophy to user's trophies array
    user.profile.trophies.push(trophy);
    await user.save();

    // Flatten user data for frontend compatibility
    const userObj = user.toObject();
    const flattenedUser = {
      ...userObj,
      bio: userObj.profile?.bio || '',
      website: userObj.profile?.socialLinks?.website || '',
      socialLinks: userObj.profile?.socialLinks || {},
      isPublic: userObj.profile?.isPublic !== false,
      lastActive: userObj.profile?.lastActive || userObj.createdAt,
      trophies: userObj.profile?.trophies || [],
    };

    res.status(200).json({
      success: true,
      message: 'Trophy awarded successfully',
      user: flattenedUser
    });
  } catch (error) {
    console.error('Error awarding trophy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/trophies/{trophyId}:
 *   delete:
 *     summary: Remove a trophy from a user
 *     description: Remove a specific trophy from a user's profile (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *       - in: path
 *         name: trophyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The trophy ID to remove
 *     responses:
 *       200:
 *         description: Trophy removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Trophy removed successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request, user or trophy not found
 *       401:
 *         description: Unauthorized - Admin role required
 *       500:
 *         description: Internal server error
 */
router.delete('/users/:userId/trophies/:trophyId', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { userId, trophyId } = req.params;

    // Find the user and remove the trophy
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }    // Ensure user has profile and trophies array
    if (!user.profile) {
      user.profile = {};
    }
    if (!user.profile.trophies) {
      user.profile.trophies = [];
    }

    // Find and remove the trophy
    const trophyIndex = user.profile.trophies.findIndex(trophy => trophy._id.toString() === trophyId);
    if (trophyIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Trophy not found'
      });
    }    user.profile.trophies.splice(trophyIndex, 1);
    await user.save();

    // Flatten user data for frontend compatibility
    const userObj = user.toObject();
    const flattenedUser = {
      ...userObj,
      bio: userObj.profile?.bio || '',
      website: userObj.profile?.socialLinks?.website || '',
      socialLinks: userObj.profile?.socialLinks || {},
      isPublic: userObj.profile?.isPublic !== false,
      lastActive: userObj.profile?.lastActive || userObj.createdAt,
      trophies: userObj.profile?.trophies || [],
    };

    res.status(200).json({
      success: true,
      message: 'Trophy removed successfully',
      user: flattenedUser
    });
  } catch (error) {
    console.error('Error removing trophy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/trophies/{trophyId}:
 *   put:
 *     summary: Update a user's trophy
 *     description: Update an existing trophy for a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *       - in: path
 *         name: trophyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The trophy ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trophyName:
 *                 type: string
 *                 description: Name of the trophy
 *               description:
 *                 type: string
 *                 description: Description of the trophy achievement
 *               season:
 *                 type: string
 *                 description: Season when the trophy was earned
 *               year:
 *                 type: number
 *                 description: Year when the trophy was earned
 *     responses:
 *       200:
 *         description: Trophy updated successfully
 *       400:
 *         description: Bad request, user or trophy not found
 *       401:
 *         description: Unauthorized - Admin role required
 *       500:
 *         description: Internal server error
 */
router.put('/users/:userId/trophies/:trophyId', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { userId, trophyId } = req.params;
    const { trophyName, description, season, year } = req.body;    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure user has profile and trophies array
    if (!user.profile) {
      user.profile = {};
    }
    if (!user.profile.trophies) {
      user.profile.trophies = [];
    }

    // Find the trophy to update
    const trophy = user.profile.trophies.id(trophyId);
    if (!trophy) {
      return res.status(400).json({
        success: false,
        message: 'Trophy not found'
      });
    }

    // Update trophy fields if provided
    if (trophyName) trophy.trophyName = trophyName;
    if (description) trophy.description = description;
    if (season && year) trophy.dateEarned = `${season} ${year}`;    await user.save();

    // Flatten user data for frontend compatibility
    const userObj = user.toObject();
    const flattenedUser = {
      ...userObj,
      bio: userObj.profile?.bio || '',
      website: userObj.profile?.socialLinks?.website || '',
      socialLinks: userObj.profile?.socialLinks || {},
      isPublic: userObj.profile?.isPublic !== false,
      lastActive: userObj.profile?.lastActive || userObj.createdAt,
      trophies: userObj.profile?.trophies || [],
    };

    res.status(200).json({
      success: true,
      message: 'Trophy updated successfully',
      user: flattenedUser
    });
  } catch (error) {
    console.error('Error updating trophy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/admin/blacklisted-users:
 *   get:
 *     summary: Get blacklisted Discord users with their info
 *     description: Retrieve Discord user information for blacklisted submitter IDs (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blacklisted users information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blacklistedSubmitters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Discord user ID
 *                       username:
 *                         type: string
 *                         description: Discord username
 *                       discriminator:
 *                         type: string
 *                         description: Discord discriminator (legacy format)
 *                       global_name:
 *                         type: string
 *                         description: Discord global display name
 *                       avatar:
 *                         type: string
 *                         description: Discord avatar hash
 *                 blacklistedStreamers:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of blacklisted streamer usernames
 *       401:
 *         description: Unauthorized - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/blacklisted-users', authorizeRoles(['admin']), async (req, res) => {
  try {
    // Get admin config
    const adminConfig = await AdminConfig.findOne();
    const blacklistedSubmitters = adminConfig?.blacklistedSubmitters || [];
    const blacklistedStreamers = adminConfig?.blacklistedStreamers || [];

    // Convert stored blacklistedSubmitters to the expected format
    const blacklistedSubmittersInfo = blacklistedSubmitters.map(submitter => ({
      id: submitter.userId,
      username: submitter.username,
      discriminator: submitter.discriminator,
      global_name: submitter.global_name,
      avatar: submitter.avatar
    }));

    res.json({
      blacklistedSubmitters: blacklistedSubmittersInfo,
      blacklistedStreamers: blacklistedStreamers
    });
  } catch (error) {
    console.error('Error fetching blacklisted users:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/discord-user/{userId}:
 *   get:
 *     summary: Get Discord user information by ID
 *     description: Retrieve Discord user information for a specific user ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: Discord user ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discord user information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Discord user ID
 *                 username:
 *                   type: string
 *                   description: Discord username
 *                 global_name:
 *                   type: string
 *                   description: Discord global display name
 *                 avatar:
 *                   type: string
 *                   description: Discord avatar hash
 *       401:
 *         description: Unauthorized - Admin role required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/discord-user/:userId', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    try {
      const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        res.json({
          id: userData.id,
          username: userData.username,
          global_name: userData.global_name,
          avatar: userData.avatar
        });
      } else if (response.status === 404) {
        res.status(404).json({ 
          error: 'Discord user not found',
          id: userId,
          username: `Unknown User (${userId})`
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to fetch Discord user information' 
        });
      }
    } catch (discordError) {
      console.error(`Error fetching Discord user ${userId}:`, discordError);
      res.status(500).json({ 
        error: 'Failed to fetch Discord user information',
        details: discordError.message
      });
    }
  } catch (error) {
    console.error('Error in discord-user endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get all reports
 *     description: Retrieve all clip reports for admin review
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved, dismissed]
 *         description: Filter by report status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of reports per page
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 pendingCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/reports', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Get reports with pagination
    const [reports, total, pendingCount] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(query),
      Report.countDocuments({ status: 'pending' })
    ]);
    
    const pages = Math.ceil(total / parseInt(limit));
    
    res.json({
      reports,
      total,
      page: parseInt(page),
      pages,
      pendingCount
    });
    
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reports/{reportId}:
 *   patch:
 *     summary: Update report status
 *     description: Update the status and admin notes of a report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved, dismissed]
 *                 description: New status for the report
 *               adminNotes:
 *                 type: string
 *                 description: Admin notes about the report
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.patch('/reports/:reportId', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const reviewerUsername = req.user.username;
    
    // Get the current report to check previous status
    const currentReport = await Report.findById(reportId);
    if (!currentReport) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const updateData = {};
    const previousStatus = currentReport.status;
    
    if (status) {
      updateData.status = status;
      if (status !== 'pending') {
        updateData.reviewedBy = reviewerUsername;
        updateData.reviewedAt = new Date();
      } else {
        updateData.reviewedBy = null;
        updateData.reviewedAt = null;
      }
    }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    );
    
    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Send notification to reporter when status changes to resolved or dismissed
    if (status && status !== previousStatus && (status === 'resolved' || status === 'dismissed')) {
      try {
        const notification = new Notification({
          recipientId: updatedReport.reporterId,
          senderId: req.user.id,
          senderUsername: reviewerUsername,
          type: 'report',
          entityId: reportId,
          clipId: updatedReport.clipId,
          message: `Your report on "${updatedReport.clipTitle}" has been ${status}`,
          read: false
        });
        
        await notification.save();
      } catch (notificationError) {
        // Log the error but don't fail the request
        console.error('Error creating status change notification:', notificationError);
      }
    }
    
    // Send notification to reporter when admin notes are added or updated
    if (adminNotes !== undefined && adminNotes !== currentReport.adminNotes) {
      try {
        let noteMessage;
        if (currentReport.adminNotes && adminNotes) {
          noteMessage = `Admin updated notes on your report for "${updatedReport.clipTitle}"`;
        } else if (adminNotes) {
          noteMessage = `Admin added notes to your report for "${updatedReport.clipTitle}"`;
        }
        
        // Only send notification if notes were actually added or updated (not removed)
        if (noteMessage) {
          const notification = new Notification({
            recipientId: updatedReport.reporterId,
            senderId: req.user.id,
            senderUsername: reviewerUsername,
            type: 'report',
            entityId: reportId,
            clipId: updatedReport.clipId,
            message: noteMessage,
            read: false
          });
          
          await notification.save();
        }
      } catch (notificationError) {
        // Log the error but don't fail the request
        console.error('Error creating admin notes notification:', notificationError);
      }
    }
    
    res.json(updatedReport);
    
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reports/{reportId}:
 *   delete:
 *     summary: Delete a report
 *     description: Permanently delete a report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.delete('/reports/:reportId', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const deletedReport = await Report.findByIdAndDelete(reportId);
    
    if (!deletedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reports/{reportId}/messages:
 *   get:
 *     summary: Get messages for a specific report
 *     description: Retrieve all messages for a report (Admin and reporter can see their conversation)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReportMessage'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.get('/reports/:reportId/messages', authorizeRoles(['user', 'clipteam', 'editor', 'admin']), async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    
    // Check if report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check permissions - admin can see all, reporter can only see their own report
    const isAdmin = userRoles.includes('admin');
    const isReporter = report.reporterId.toString() === userId;
    
    if (!isAdmin && !isReporter) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build query - admins see all messages, reporters don't see internal messages
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
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reports/{reportId}/messages:
 *   post:
 *     summary: Send a message in a report
 *     description: Add a new message to a report conversation
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Message content
 *               isInternal:
 *                 type: boolean
 *                 description: Whether this is an internal admin message (admin only)
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportMessage'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
router.post('/reports/:reportId/messages', authorizeRoles(['user', 'clipteam', 'editor', 'admin']), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { message, isInternal = false } = req.body;
    const userId = req.user.id;
    const username = req.user.username;
    const userRoles = req.user.roles || [];
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Check if report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check permissions
    const isAdmin = userRoles.includes('admin');
    const isReporter = report.reporterId.toString() === userId;
    
    if (!isAdmin && !isReporter) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Only admins can send internal messages
    if (isInternal && !isAdmin) {
      return res.status(403).json({ error: 'Only admins can send internal messages' });
    }
    
    // Create message
    const newMessage = new ReportMessage({
      reportId,
      senderId: userId,
      senderUsername: username,
      senderRole: isAdmin ? 'admin' : 'reporter',
      message: message.trim(),
      isInternal,
      readBy: [{
        userId,
        username,
        readAt: new Date()
      }]
    });
    
    await newMessage.save();
    
    // Create notification for the other party (if not internal message)
    if (!isInternal) {
      let recipientId, recipientUsername;
      
      if (isAdmin) {
        // Admin messaging reporter
        recipientId = report.reporterId;
        recipientUsername = report.reporterUsername;
      } else {
        // Reporter messaging admins - notify all admins
        const admins = await User.find({ roles: 'admin', status: 'active' });
        
        // Create notifications for all admins
        const notifications = admins.map(admin => new Notification({
          recipientId: admin._id,
          senderId: userId,
          senderUsername: username,
          type: 'report',
          entityId: reportId,
          clipId: report.clipId,
          message: `New message on report for "${report.clipTitle}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
          read: false
        }));
        
        await Promise.all(notifications.map(notification => notification.save()));
      }
      
      // If admin is messaging reporter, create single notification
      if (isAdmin) {
        const notification = new Notification({
          recipientId,
          senderId: userId,
          senderUsername: username,
          type: 'report',
          entityId: reportId,
          clipId: report.clipId,
          message: `Admin replied to your report on "${report.clipTitle}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
          read: false
        });
        
        await notification.save();
      }
    }
    
    res.status(201).json(newMessage);
    
  } catch (error) {
    console.error('Error sending report message:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reports/{reportId}/messages/{messageId}:
 *   delete:
 *     summary: Delete a report message
 *     description: Delete a message from a report (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.delete('/reports/:reportId/messages/:messageId', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { reportId, messageId } = req.params;
    
    const deletedMessage = await ReportMessage.findOneAndDelete({
      _id: messageId,
      reportId
    });
    
    if (!deletedMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting report message:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;