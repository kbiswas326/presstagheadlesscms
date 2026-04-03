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

// Tenant detection middleware
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const tenantHeader = req.headers['x-tenant-id'];

  if (tenantHeader) {
    req.tenantId = tenantHeader; // explicit header takes priority
  } else if (host.includes('sportzpoint')) {
    req.tenantId = 'sportzpoint';
  } else {
    req.tenantId = 'presstag'; // default
  }

  next();
});

app.use(cors({
  origin: '*',
  credentials: false,
}));

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