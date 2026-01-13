// routes/media.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Media = require('../models/Media');
const authMiddleware = require('../middleware/auth');

/**
 * MULTER STORAGE (SANITIZED FILENAMES)
 */
const storage = multer.diskStorage({
  destination: 'uploads/',
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

    console.log('📤 Received metadata:', { altText, title, caption, credits }); // Debug log

    const media = await Media.create({
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      type: file.mimetype,
      size: file.size,
      altText: altText || '',
      title: title || '',
      caption: caption || '',
      credits: credits || '',
      uploadedBy: req.user ? req.user._id : null,
    });

    console.log('✅ Saved to database:', media); // Debug log

    res.json(media);
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
    const media = await Media.findAll(); // ✅ Remove order parameter - handled in model
    console.log('📚 Fetched media count:', media.length); // Debug log
    if (media.length > 0) {
      console.log('Sample media item:', media[0]); // Debug log
    }
    res.json(media);
  } catch (err) {
    console.error('Fetch media error:', err);
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

module.exports = router;