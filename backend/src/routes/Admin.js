const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const { AdminConfig, PublicConfig } = require('../models/configModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');

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

module.exports = router;