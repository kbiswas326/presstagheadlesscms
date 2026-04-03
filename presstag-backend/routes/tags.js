///backend/routes/categories.js | Express routes for managing categories, including endpoints for creating, retrieving, updating, and deleting categories.///
const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const tag = await Tag.create(req.body, req.tenantId);
    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const tags = await Tag.findAll(req.tenantId);
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/by-slug/:slug', async (req, res) => {
  try {
    const tag = await Tag.findBySlug(req.params.slug, req.tenantId);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const tag = await Tag.update(req.params.id, req.body, req.tenantId);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Tag.delete(req.params.id, req.tenantId);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;