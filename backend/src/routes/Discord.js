const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

const User = require('../models/userModel');
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

router.get('/auth', (req, res) => {
  const state = encodeURIComponent(req.query.siteUserId);
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=1265824671224561766&response_type=code&redirect_uri=${encodeURIComponent('https://api.spoekle.com/api/discord/callback')}&scope=identify+guilds.members.read+email&state=${state}`;
  res.redirect(discordAuthUrl);
});

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
      redirect_uri: 'https://api.spoekle.com/api/discord/callback'
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
      if (existingUser.status !== 'active') res.redirect(403, `https://clipsesh.cube.community`);
      const existingToken = jwt.sign({ id: existingUser._id, username: existingUser.username, roles: existingUser.roles }, secretKey, { expiresIn: '1 day' });
      return res.redirect(`https://clipsesh.cube.community?token=${encodeURIComponent(existingToken)}`);
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
        if (user.status !== 'active') return res.redirect(403, `https://clipsesh.cube.community`);
        const userToken = jwt.sign({ id: user._id, username: user.username, roles: user.roles }, secretKey, { expiresIn: '1 day' });
        return res.redirect(`https://clipsesh.cube.community?token=${encodeURIComponent(userToken)}`);
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
    if (newUser.status !== 'active') return res.redirect(403, `https://clipsesh.cube.community`);
    const userToken = jwt.sign({ id: newUser._id, username: newUser.username, roles: newUser.roles }, secretKey, { expiresIn: '1 day' });
    return res.redirect(`https://clipsesh.cube.community?token=${encodeURIComponent(userToken)}`);
  } catch (error) {

    if (error.response) {
      console.error('API response error:', error.response.data);
      res.status(500).json({ error: 'Whoopsies, you probably have to link your account first before logging in', details: error.response.data });
    } else {
      res.status(500).json({ error: 'Whoopsies, you probably have to link your account first before logging in', details: error.message });
    }
  }
});

module.exports = router;
