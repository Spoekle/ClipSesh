const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const AdminConfig = require('../models/configModel');
const authorizeRoles = require('./middleware/AuthorizeRoles');

// Admin user creation endpoint
router.post('/create-user', authorizeRoles(['admin']), async (req, res) => {
  try {
    const { username, password, roles } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      username: username,
      password: hashedPassword, 
      roles: roles || ['user']
    });
    await newUser.save();
    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update user
router.put('/users/:id', authorizeRoles(['admin']), async (req, res) => {
  const { username, password, roles, profilePicture, status } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username) user.username = username;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (roles) user.roles = roles;
    if (profilePicture) user.profilePicture = profilePicture;
    if (status) user.status = status;

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get the deny threshold
router.get('/config', async (req, res) => {
  try {
    const config = await AdminConfig.find();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update the deny threshold
router.put('/config', authorizeRoles(['admin']), async (req, res) => {
  const { denyThreshold, latestVideoLink } = req.body;
  try {
    let config = await AdminConfig.findOne();
    if (!config) {
      config = new AdminConfig({ denyThreshold, latestVideoLink });
    } else {
      config.denyThreshold = denyThreshold;
      config.latestVideoLink = latestVideoLink;
    }
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;