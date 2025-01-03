const rateLimit = require('express-rate-limit');

const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Too many search requests from this IP, please try again later.'
  });

module.exports = searchLimiter;