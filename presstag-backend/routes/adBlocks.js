const express = require('express');
const router = express.Router();
const AdBlock = require('../models/AdBlock');
const authMiddleware = require('../middleware/auth');

// Get all ad blocks
router.get('/', async (req, res) => {
  try {
    const ads = await AdBlock.findAll();
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single ad block
router.get('/:id', async (req, res) => {
  try {
    const ad = await AdBlock.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad Block not found' });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create ad block
router.post('/', authMiddleware, async (req, res) => {
  try {
    const ad = await AdBlock.create(req.body);
    res.status(201).json(ad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update ad block
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const ad = await AdBlock.update(req.params.id, req.body);
    res.json(ad);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete ad block
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const success = await AdBlock.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Ad Block not found' });
    res.json({ message: 'Ad Block deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
