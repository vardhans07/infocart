const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization")?.replace("Bearer ", "");
  if (!authHeader) {
    console.log('Auth middleware: No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
    console.log('Auth middleware: Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware: Invalid token:', err.message);
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};