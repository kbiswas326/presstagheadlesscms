///backend/routes/users.js | Express routes for managing users, including endpoints for creating, retrieving, updating, and deleting users.///
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const users = await User.findAll(req.tenantId);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/public/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const { getDB } = require('../config/db');
    const db = getDB(req.tenantId);

    let user;
    if (ObjectId.isValid(req.params.id)) {
      user = await User.findById(req.params.id);
    }
    
    if (!user) {
      user = await db.collection('users').findOne({ slug: req.params.id });
    }

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      _id: user._id,
      name: user.name,
      bio: user.bio,
      image: user.image,
      slug: user.slug,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, req.tenantId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.update(req.params.id, req.body, req.tenantId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await User.delete(req.params.id, req.tenantId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
