const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }

    // Attach user information to the request object
    req.user = {
      id: decoded.id || decoded.botId,
      username: decoded.username || decoded.botUsername,
      roles: decoded.roles || []
    };

    next();
  });
}

module.exports = verifyToken;