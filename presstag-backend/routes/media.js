// routes/media.js | Handles media uploads and retrieval for the media library
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const Media = require('../models/Media');
const authMiddleware = require('../middleware/auth');

/**
 * R2 CLIENT SETUP
 */
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Memory storage — no local disk
const upload = multer({ storage: multer.memoryStorage() });

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

    // Build R2 key: clientId/timestamp-filename
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    const baseName = file.originalname
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filename = `${Date.now()}-${baseName}${ext}`;
    const r2Key = `${clientId}/${filename}`;

    // Upload to R2
    const parallelUpload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await parallelUpload.done();

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

    console.log('☁️ Uploaded to R2:', imageUrl);

    const media = await Media.create({
      filename: r2Key,        // store full R2 key so we can delete later
      url: imageUrl,          // permanent public URL
      type: file.mimetype,
      size: file.size,
      altText: altText || '',
      title: title || '',
      caption: caption || '',
      credits: credits || '',
      uploadedBy: req.user ? req.user._id : null,
    });

    console.log('✅ Saved to database:', media);

    res.json({
      ...media._doc,
      fullUrl: imageUrl,
    });

  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({ message: 'Media upload failed', error: err.message });
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
      limit: parseInt(limit),
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
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('Search media error:', err);
    res.status(500).json({ message: 'Failed to search media' });
  }
});

/**
 * DELETE MEDIA
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: 'Media not found' });

    // Delete from R2
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: media.filename, // this is the r2Key we stored
    }));

    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Media deleted' });

  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
});

module.exports = router;