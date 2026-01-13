///middleware/auth.js///
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const fs = require('fs');
const path = require('path');

const logAuthError = (msg) => {
  try {
    fs.appendFileSync(path.join(__dirname, '../auth_errors.log'), `${new Date().toISOString()} - ${msg}\n`);
  } catch (e) { console.error('Log failed', e); }
};


const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔐 [Auth] Processing:', req.method, req.path);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logAuthError('No token provided in header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logAuthError('JWT_SECRET missing');
      console.error('❌ JWT_SECRET missing');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // 🔓 Verify JWT
    if (!token || token === 'undefined' || token === 'null') {
        logAuthError(`Invalid token string: '${token}'`);
        throw new Error('Token is empty or invalid string');
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded.userId || !ObjectId.isValid(decoded.userId)) {
      logAuthError(`Invalid token payload: ${JSON.stringify(decoded)}`);
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // 🔍 Fetch user from DB
    const db = getDB();
    if (!db) {
        logAuthError('Database not initialized');
        console.error('❌ Database not initialized');
        return res.status(503).json({ error: 'Database not available' });
    }

    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId),
    });

    if (!user) {
      logAuthError(`User not found for ID: ${decoded.userId}`);
      return res.status(401).json({ error: 'User not found' });
    }

    // ✅ Attach FULL user context
    req.user = {
      _id: user._id.toString(),
      role: user.role || 'author', // default safety
      name: user.name,
      email: user.email,
    };

    console.log(
      `✅ Authenticated: ${req.user.name} (${req.user.role})`
    );

    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    logAuthError(`${error.name}: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError' || error.message === 'Token is empty or invalid string') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // For other errors (DB connection, etc), return 500 to prevent logout
    res.status(500).json({ error: 'Internal Server Error during auth' });
  }
};

module.exports = authMiddleware;
