const { verifyToken } = require('../utils/auth');
const db = require('../db/database');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }

  const user = db.findUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User account not found.' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    caregiverCode: user.caregiverCode
  };

  next();
};

module.exports = authMiddleware;
