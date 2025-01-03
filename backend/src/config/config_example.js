// This file is an example of the configuration file for the backend. after creating the file, 
// rename it to config.js
// The config.js file should contain the following:

const crypto = require('crypto');

// Admin credentials
const adminUsername = 'admin';
process.env.ADMIN_USERNAME = adminUsername;
const adminPassword = crypto.randomBytes(15).toString('hex').match(/.{1,5}/g).join('-');
process.env.ADMIN_PASSWORD = adminPassword;

// Discord OAuth2 credentials for the application
const CLIENT_ID = '';
process.env.DISCORD_CLIENT_ID = CLIENT_ID;
const CLIENT_SECRET = '';
process.env.DISCORD_CLIENT_SECRET = CLIENT_SECRET;

// Secret key for JWT
const secretKey = crypto.randomBytes(64).toString('hex');
process.env.SECRET_KEY = secretKey;