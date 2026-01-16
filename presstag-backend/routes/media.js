// routes/media.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/Media');
const authMiddleware = require('../middleware/auth');

/**
 * MULTER STORAGE (CLIENT-SPECIFIC FOLDERS)
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const clientId = req.user?.clientId || req.headers['x-client-id'] || 'default';
    const uploadPath = path.join('uploads', clientId);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    cb(null, `${Date.now()}-${baseName}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * UPLOAD MEDIA
 */
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { altText, title, caption, credits } = req.body;
    const clientId = req.user?.clientId || req.headers['x-client-id'] || 'default';

    console.log('📤 Received metadata:', { altText, title, caption, credits, clientId });

    // ✅ Store RELATIVE path with client folder
    const relativePath = `/uploads/${clientId}/${file.filename}`;

    const media = await Media.create({
      filename: file.filename,
      url: relativePath, // ✅ Relative path, not absolute
      type: file.mimetype,
      size: file.size,
      altText: altText || '',
      title: title || '',
      caption: caption || '',
      credits: credits || '',
      uploadedBy: req.user ? req.user._id : null,
    });

    console.log('✅ Saved to database:', media);

    // Return both relative path (for DB) and full URL (for immediate display)
    res.json({
      ...media,
      fullUrl: `${req.protocol}://${req.get('host')}${relativePath}`
    });
  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({ message: 'Media upload failed' });
  }
});

/**
 * GET MEDIA LIBRARY
 */
router.get('/', async (req, res) => {
  try {
    const media = await Media.findAll();
    console.log('📚 Fetched media count:', media.length);
    res.json(media);
  } catch (err) {
    console.error('Fetch media error:', err);
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

/**
 * GET /api/media/img (for admin page with pagination)
 */
router.get('/img', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;
    
    const media = await Media.findAll();
    const paginatedMedia = media.slice(skip, skip + parseInt(limit));
    
    res.json({
      images: paginatedMedia,
      total: media.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Fetch media error:', err);
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

/**
 * GET /api/media/search (for search functionality)
 */
router.get('/search', async (req, res) => {
  try {
    const { alt = '', page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;
    
    const media = await Media.findAll();
    const filtered = media.filter(m => 
      (m.altText || '').toLowerCase().includes(alt.toLowerCase()) ||
      (m.filename || '').toLowerCase().includes(alt.toLowerCase())
    );
    
    const paginatedMedia = filtered.slice(skip, skip + parseInt(limit));
    
    res.json({
      images: paginatedMedia,
      total: filtered.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Search media error:', err);
    res.status(500).json({ message: 'Failed to search media' });
  }
});

module.exports = router;