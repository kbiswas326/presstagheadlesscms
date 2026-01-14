/// server.js ///
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const tagRoutes = require('./routes/tags');
const postRoutes = require('./routes/posts');
const mediaRoutes = require('./routes/media');
const layoutConfigRoutes = require('./routes/layoutConfig');
const adBlockRoutes = require('./routes/adBlocks');

const app = express();

/**
 * ============================
 * CORS CONFIG (IMPORTANT)
 * ============================
 */
app.use(
  cors({
    origin: [
      'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003',
      'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002', 'http://127.0.0.1:3003'
    ],
    credentials: true,
  })
);

/**
 * ============================
 * MIDDLEWARE
 * ============================
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * ============================
 * DATABASE
 * ============================
 */
connectDB();

/**
 * ============================
 * STATIC FILES
 * ============================
 */
app.use('/uploads', express.static('uploads'));

/**
 * ============================
 * TEST ROUTE
 * ============================
 */
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working! 🎉' });
});

/**
 * ============================
 * API ROUTES
 * ============================
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/layout-config', layoutConfigRoutes);
app.use('/api/ad-blocks', adBlockRoutes);

/**
 * ============================
 * START SERVER
 * ============================
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
