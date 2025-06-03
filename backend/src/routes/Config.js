const express = require('express');
const router = express.Router();
const { PublicConfig, AdminConfig } = require('../models/configModel');
const Clip = require('../models/clipModel'); // Add this import
const authorizeRoles = require('./middleware/AuthorizeRoles');

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
  } catch (error) {
    console.error('Error updating clip count:', error);
  }
}

/**
 * @swagger
 * /api/config/public:
 *   get:
 *     summary: Get public configuration
 *     description: Retrieve public configuration parameters (latest video link)
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/public', async (req, res) => {
  try {
    // Find or create the public config
    let publicConfig = await PublicConfig.findOne();
    if (!publicConfig) {
      publicConfig = new PublicConfig();
      await publicConfig.save();
    }
    
    // Update clip count if needed
    if (publicConfig.clipAmount === undefined || publicConfig.clipAmount === 0) {
      await updateClipCount();
      publicConfig = await PublicConfig.findOne();
    }
    
    res.json(publicConfig);
  } catch (error) {
    console.error('Error fetching public config:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/config/public:
 *   put:
 *     summary: Update public configuration
 *     description: Update public configuration parameters (Admin only)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublicConfig'
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/public', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { latestVideoLink } = req.body;
    
    // Find or create the public config
    let publicConfig = await PublicConfig.findOne();
    if (!publicConfig) {
      publicConfig = new PublicConfig();
    }
    
    // Update fields
    publicConfig.latestVideoLink = latestVideoLink;
    
    await publicConfig.save();
    res.json(publicConfig);
  } catch (error) {
    console.error('Error updating public config:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/config/admin:
 *   get:
 *     summary: Get admin configuration
 *     description: Retrieve admin configuration parameters (Admin only)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/admin', authorizeRoles(['admin']), async (req, res) => {
  try {
    // Find or create the admin config
    let adminConfig = await AdminConfig.findOne();
    if (!adminConfig) {
      adminConfig = new AdminConfig();
      await adminConfig.save();
    }
    res.json({ admin: adminConfig });
  } catch (error) {
    console.error('Error fetching admin config:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/config/admin:
 *   put:
 *     summary: Update admin configuration
 *     description: Update admin configuration parameters (Admin only)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminConfig'
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/admin', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { denyThreshold, clipChannelIds, backendUrl, discordBotToken } = req.body;
    
    // Find or create the admin config
    let adminConfig = await AdminConfig.findOne();
    if (!adminConfig) {
      adminConfig = new AdminConfig();
    }
    
    // Update fields if provided
    if (denyThreshold !== undefined) adminConfig.denyThreshold = denyThreshold;
    if (clipChannelIds !== undefined) adminConfig.clipChannelIds = clipChannelIds;
    if (backendUrl !== undefined) adminConfig.backendUrl = backendUrl;
    if (discordBotToken !== undefined) adminConfig.discordBotToken = discordBotToken;
    
    await adminConfig.save();
    res.json(adminConfig);
  } catch (error) {
    console.error('Error updating admin config:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Get combined configuration
 *     description: Retrieve both public and admin configuration (admin only)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authorizeRoles(['admin', 'clipteam', 'editor']), async (req, res) => {
  try {
    // Find both configs or create if they don't exist
    let [publicConfig, adminConfig] = await Promise.all([
      PublicConfig.findOne() || new PublicConfig(),
      AdminConfig.findOne() || new AdminConfig()
    ]);
    
    // If they're new, save them
    if (!publicConfig._id) await publicConfig.save();
    if (!adminConfig._id) await adminConfig.save();
    
    // Return combined config
    res.json({
      public: publicConfig,
      admin: adminConfig
    });
  } catch (error) {
    console.error('Error fetching combined config:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;