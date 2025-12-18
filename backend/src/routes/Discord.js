const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const verifyToken = require('./middleware/VerifyToken');
const { AdminConfig } = require('../models/configModel');
const User = require('../models/userModel');
const frontendUrl = process.env.FRONTEND_URL || 'https://clipsesh.cube.community';
const backendUrl = process.env.BACKEND_URL || 'https://api.spoekle.com';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const secretKey = process.env.SECRET_KEY;

// For users to link Discord account
router.get('/auth', (req, res) => {
  const state = encodeURIComponent(req.query.siteUserId);
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(`${backendUrl}/api/discord/callback`)}&scope=identify+guilds.members.read+email&state=${state}&prompt=none`;
  res.redirect(discordAuthUrl);
});

// New route for bot login
router.get('/bot-auth', (req, res) => {
  const discordBotAuthUrl = `https://discord.com/oauth2/authorize?client_id=1265824671224561766&response_type=code&redirect_uri=${encodeURIComponent(`${backendUrl}/api/discord/bot-callback`)}&scope=identify+guilds.members.read+email&state=bot`;
  res.redirect(discordBotAuthUrl);
});

// User linking callback
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = decodeURIComponent(req.query.state);

  if (!code || !state) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${backendUrl}/api/discord/callback`
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const discordUser = userResponse.data;

    const guildsResponse = await axios.get(`https://discord.com/api/v10/users/@me/guilds/506190415981051915/member`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userGuildInfo = guildsResponse.data;

    const ROLE_PRIORITY = [
      { id: '564614999855595520', role: 'admin' },
      { id: '506190660412375040', role: 'admin' },
      { id: '528492877932658693', role: 'editor' },
      { id: '889451337182502942', role: 'clipteam' },
    ];

    const determineUserRoles = (userRoles) => {
      const roles = ['user']; // Default role
      ROLE_PRIORITY.forEach(({ id, role }) => {
        if (userRoles.includes(id)) {
          roles.push(role);
        }
      });
      return roles;
    };

    // Check if the Discord account is already linked to an existing user
    let existingUser = await User.findOne({ discordId: discordUser.id });
    if (existingUser) {
      existingUser.profilePicture = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}`;
      await existingUser.save();
      if (existingUser.status !== 'active') res.redirect(403, frontendUrl);
      const existingToken = jwt.sign({ id: existingUser._id, username: existingUser.username, roles: existingUser.roles }, secretKey, { expiresIn: process.env.JWT_EXPIRES_IN || '7 days' });
      return res.redirect(`${frontendUrl}?token=${encodeURIComponent(existingToken)}`);
    }

    // Link the Discord account to an existing user
    if (state && state !== 'undefined') {
      let user = await User.findOne({ _id: state });
      if (user) {
        user.discordId = discordUser.id;
        user.discordUsername = discordUser.global_name;
        user.email = discordUser.email;
        user.profilePicture = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}`;
        user.roles = determineUserRoles(userGuildInfo.roles);
        await user.save();
        if (user.status !== 'active') return res.redirect(403, frontendUrl);
        const userToken = jwt.sign({ id: user._id, username: user.username, roles: user.roles }, secretKey, { expiresIn: process.env.JWT_EXPIRES_IN || '7 days' });
        return res.redirect(`${frontendUrl}?token=${encodeURIComponent(userToken)}`);
      }
    }

    // Create a new user based on the Discord account
    const newUser = new User({
      username: discordUser.global_name,
      email: discordUser.email,
      password: await bcrypt.hash(discordUser.global_name + discordUser.id, 10),
      discordId: discordUser.id,
      discordUsername: discordUser.global_name,
      profilePicture: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}`,
      status: 'active',
      roles: determineUserRoles(userGuildInfo.roles)
    });

    await newUser.save();
    if (newUser.status !== 'active') return res.redirect(403, frontendUrl);
    const userToken = jwt.sign({ id: newUser._id, username: newUser.username, roles: newUser.roles }, secretKey, { expiresIn: process.env.JWT_EXPIRES_IN || '7 days' });
    return res.redirect(`${frontendUrl}?token=${encodeURIComponent(userToken)}`);
  } catch (error) {

    if (error.response) {
      console.error('API response error:', error.response.data);
      res.status(500).json({ error: 'Whoopsies, you probably have to link your account first before logging in', details: error.response.data });
    } else {
      res.status(500).json({ error: 'Whoopsies, you probably have to link your account first before logging in', details: error.message });
    }
  }
});

// Bot login callback - this will authorize the bot to access the backend
router.get('/bot-callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!code || state !== 'bot') {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://api.spoekle.com/api/discord/bot-callback'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token } = tokenResponse.data;

    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const discordUser = userResponse.data;

    // Check if user has admin rights in Discord
    const guildsResponse = await axios.get(`https://discord.com/api/v10/users/@me/guilds/506190415981051915/member`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userGuildInfo = guildsResponse.data;
    let isAdmin = false;

    // Admin role IDs
    const adminRoleIds = ['564614999855595520', '506190660412375040'];
    
    for (const roleId of adminRoleIds) {
      if (userGuildInfo.roles.includes(roleId)) {
        isAdmin = true;
        break;
      }
    }

    if (!isAdmin) {
      return res.status(403).json({ error: 'You do not have admin privileges to authenticate as bot' });
    }

    // Store the bot tokens in admin config
    let adminConfig = await AdminConfig.findOne();
    if (!adminConfig) {
      adminConfig = new AdminConfig();
    }

    // Store Discord bot credentials
    adminConfig.discordUploadUsername = discordUser.username;
    adminConfig.discordUploadPassword = refresh_token; // Use refresh token as the password

    await adminConfig.save();

    // Create a special JWT token for the bot
    const botToken = jwt.sign({ 
      botId: discordUser.id, 
      botUsername: discordUser.username, 
      roles: ['bot', 'admin'] 
    }, secretKey, { 
      expiresIn: process.env.BOT_TOKEN_EXPIRES_IN || '30 days' // Longer expiration for bot token
    });

    // Redirect to a bot success page
    return res.redirect(`${frontendUrl}/bot-success?botToken=${encodeURIComponent(botToken)}`);
  } catch (error) {
    console.error('Bot authentication error:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to authenticate bot', 
      details: error.response?.data || error.message
    });
  }
});

// Get Discord bot token - only accessible with bot credentials
router.get('/bot-token', verifyToken, async (req, res) => {
  try {
    // Only allow the bot user to access this endpoint
    if (!req.user || !req.user.roles.includes('bot')) {
      return res.status(403).json({ error: 'Unauthorized: Only bot users can access this endpoint' });
    }

    // Get the bot token from AdminConfig
    const adminConfig = await AdminConfig.findOne();
    if (!adminConfig || !adminConfig.discordBotToken) {
      return res.status(404).json({ error: 'Discord bot token not found' });
    }

    res.json({ token: adminConfig.discordBotToken });
  } catch (error) {
    console.error('Error getting Discord bot token:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
