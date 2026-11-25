
// routes/media.js | Handles media uploads and retrieval for the media library

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const Media = require('../models/Media');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// Shared R2 client (existing configuration for other tenants)
const sharedS3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Dedicated SportzPoint R2 client
const sportzPointS3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.SPORTZPOINT_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.SPORTZPOINT_R2_SECRET_ACCESS_KEY,
  },
});

// Resolve storage configuration based on tenant
const getStorageConfig = (clientId) => {
  if (clientId === 'sportzpoint') {
    return {
      s3: sportzPointS3,
      bucket: process.env.SPORTZPOINT_R2_BUCKET_NAME,
      publicUrl: process.env.SPORTZPOINT_R2_PUBLIC_URL,
      prefix: '',
    };
  }

  return {
    s3: sharedS3,
    bucket: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
    prefix: `${clientId}/`,
  };
};

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { altText, title, caption, credits } = req.body;
    const clientId = req.tenantId || req.user?.clientId || 'default';

    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
    const baseName = file.originalname
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const filename = `${Date.now()}-${baseName}${ext}`;
    const storage = getStorageConfig(clientId);
    const r2Key = `${storage.prefix}${filename}`;

    if (!storage.bucket || !storage.publicUrl) {
      throw new Error(`R2 storage configuration missing for tenant: ${clientId}`);
    }

    const parallelUpload = new Upload({
      client: storage.s3,
      params: {
        Bucket: storage.bucket,
        Key: r2Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await parallelUpload.done();

    const imageUrl = `${storage.publicUrl.replace(/\/$/, '')}/${r2Key}`;

    const media = await Media.create({
      filename: r2Key,
      url: imageUrl,
      type: file.mimetype,
      size: file.size,
      altText: altText || '',
      title: title || '',
      caption: caption || '',
      credits: credits || '',
      uploadedBy: req.user ? req.user._id : null,
    }, req.tenantId);

    res.json({
      ...(media._doc || media),
      fullUrl: imageUrl,
    });

  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({
      message: 'Media upload failed',
      error: err.message,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const media = await Media.findAll(req.tenantId);
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

router.get('/img', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;
    const media = await Media.findAll(req.tenantId);
    const paginatedMedia = media.slice(skip, skip + parseInt(limit));

    res.json({
      images: paginatedMedia,
      total: media.length,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { alt = '', page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;
    const media = await Media.findAll(req.tenantId);

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
    res.status(500).json({ message: 'Failed to search media' });
  }
});

router.delete('/:id', authMiddleware, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const clientId = req.tenantId || req.user?.clientId || 'default';
    const storage = getStorageConfig(clientId);

    const media = await Media.findById(req.params.id, req.tenantId);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    await storage.s3.send(new DeleteObjectCommand({
      Bucket: storage.bucket,
      Key: media.filename,
    }));

    await Media.delete(req.params.id, req.tenantId);
    res.json({ success: true, message: 'Media deleted' });

  } catch (err) {
    console.error('Media delete error:', err);
    res.status(500).json({
      message: 'Delete failed',
      error: err.message,
    });
  }
});

module.exports = router;
