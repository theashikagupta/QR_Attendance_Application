const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const auth = (roles = []) => {
  if (!Array.isArray(roles)) {
    roles = [roles];
  }

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      if (!token) {
        return res.status(401).json({ message: 'Authentication token missing' });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};

module.exports = { auth };
