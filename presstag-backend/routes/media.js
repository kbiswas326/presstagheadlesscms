// routes/media.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for dynamic client folders
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get client identifier from user session/token
    // For now, we'll use a placeholder - you'll replace this with actual client detection
    const clientId = req.user?.clientId || req.headers['x-client-id'] || 'default';
    
    // Create client-specific folder
    const uploadPath = path.join(__dirname, '../uploads', clientId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload single image
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const clientId = req.user?.clientId || req.headers['x-client-id'] || 'default';
    
    // ✅ Store RELATIVE path in database (not absolute URL)
    const relativePath = `/uploads/${clientId}/${req.file.filename}`;
    
    res.json({
      success: true,
      // Return relative path to store in database
      path: relativePath,
      // Also return full URL for immediate display
      url: `${req.protocol}://${req.get('host')}${relativePath}`,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple images
router.post('/upload-multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const clientId = req.user?.clientId || req.headers['x-client-id'] || 'default';
    
    const files = req.files.map(file => {
      const relativePath = `/uploads/${clientId}/${file.filename}`;
      return {
        path: relativePath,
        url: `${req.protocol}://${req.get('host')}${relativePath}`,
        filename: file.filename,
        size: file.size
      };
    });
    
    res.json({
      success: true,
      files: files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;