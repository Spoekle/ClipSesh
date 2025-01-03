const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

function authorizeRoles(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
      }

      // Assuming the JWT payload contains the 'roles' array
      if (!decoded.roles || !Array.isArray(decoded.roles)) {
        return res.status(403).json({ error: 'Forbidden: Roles not found in token' });
      }

      const hasPermission = decoded.roles.some(role => allowedRoles.includes(role));
      if (!hasPermission) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      // Attach user information to the request object
      req.user = {
        id: decoded.id,
        username: decoded.username,
        roles: decoded.roles,
      };

      next();
    });
  };
}

module.exports = authorizeRoles;