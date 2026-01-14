
const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const tag = await Tag.create(req.body);
    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const tags = await Tag.findAll();
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/by-slug/:slug', async (req, res) => {
  try {
    const tag = await Tag.findBySlug(req.params.slug);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const tag = await Tag.update(req.params.id, req.body);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Tag.delete(req.params.id);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;