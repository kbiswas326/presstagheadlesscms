///backend > server.js | Main Express server setup for the PressTag CMS backend, including middleware configuration, route definitions, and database connection.///
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const tagRoutes = require('./routes/tags');
const postRoutes = require('./routes/posts');
const mediaRoutes = require('./routes/media');
const layoutConfigRoutes = require('./routes/layoutConfig');
const adBlockRoutes = require('./routes/adBlocks');

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      const allowed = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://127.0.0.1:3000',
        // Vercel domains — add your exact Vercel URL here
        'https://presstagheadlesscms.vercel.app',
        // Allow all Vercel preview URLs
      ];

      // Allow any .vercel.app domain
      if (origin.endsWith('.vercel.app') || allowed.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

connectDB();

app.use('/uploads', express.static('uploads'));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working! 🎉' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/layout-config', layoutConfigRoutes);
app.use('/api/ad-blocks', adBlockRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});