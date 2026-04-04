///backend/routes/categories.js | Express routes for managing categories, including endpoints for creating, retrieving, updating, and deleting categories.///
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const category = await Category.create(req.body, req.tenantId);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const withCountsRaw = String(req.query.withCounts ?? '1').toLowerCase().trim();
    const withCounts = !(withCountsRaw === '0' || withCountsRaw === 'false');
    const categories = await Category.findAll(req.tenantId, { withCounts });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/by-slug/:slug', async (req, res) => {
  try {
    const category = await Category.findBySlug(req.params.slug, req.tenantId);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.update(req.params.id, req.body, req.tenantId);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Category.delete(req.params.id, req.tenantId);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
