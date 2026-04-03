/// routes/posts.js | Route handlers for managing blog posts
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const { generateKeyTakeaways, generateImageCaption } = require('../utils/ai');
const MOCK_POSTS = require('./mock_posts');

/* =====================================================
   HELPERS
===================================================== */

// Helper: Check permissions
function requireEditorOrAdmin(req, res) {
  if (!req.user || !['admin', 'editor'].includes(req.user.role)) {
    res.status(403).json({
      error: 'You do not have permission to perform this action',
    });
    return false;
  }
  return true;
}

// Helper: Notify author
async function notifyAuthor(db, userId, message, postId) {
  if (!userId) return;
  await db.collection('notifications').insertOne({
    userId: new ObjectId(userId),
    postId: new ObjectId(postId),
    message,
    read: false,
    createdAt: new Date(),
  });
}

// Helper: Populate relations (Categories, Tags, Author)
async function populatePost(post, db) {
  if (!post) return null;

  // categories
  let categories = [];
  if (post.categories && post.categories.length > 0) {
    const categoryIds = post.categories
      .map(id => (id && typeof id === 'object' && id._id) ? id : 
                 (typeof id === 'string' && ObjectId.isValid(id)) ? new ObjectId(id) : null)
      .filter(Boolean);

    if (categoryIds.length > 0) {
      categories = await db.collection('categories')
        .find({ _id: { $in: categoryIds } })
        .toArray();
    }
  }

  // primary_category
  let primary_category = [];
  if (post.primary_category && post.primary_category.length > 0) {
    const primaryCatIds = post.primary_category
      .map(id => (id && typeof id === 'object' && id._id) ? id : 
                 (typeof id === 'string' && ObjectId.isValid(id)) ? new ObjectId(id) : null)
      .filter(Boolean);

    if (primaryCatIds.length > 0) {
      primary_category = await db.collection('categories')
        .find({ _id: { $in: primaryCatIds } })
        .toArray();
    }
  }

  // tags
  let tags = [];
  if (post.tags && post.tags.length > 0) {
    const tagIds = post.tags
      .map(id => (id && typeof id === 'object' && id._id) ? id : 
                 (typeof id === 'string' && ObjectId.isValid(id)) ? new ObjectId(id) : null)
      .filter(Boolean);

    if (tagIds.length > 0) {
      tags = await db.collection('tags')
        .find({ _id: { $in: tagIds } })
        .toArray();
    }
  }

  // author
  let author = null;
  if (post.author) {
    const authorId = typeof post.author === 'string' && ObjectId.isValid(post.author) 
      ? new ObjectId(post.author) 
      : post.author instanceof ObjectId 
        ? post.author 
        : post.author?._id 
          ? post.author._id 
          : null;

    if (authorId) {
      author = await db.collection('users')
        .findOne({ _id: authorId }, { projection: { password: 0 } });
    }
  }

  const effectiveCategories = categories.length > 0 ? categories : primary_category;

  return {
    ...post,
    categories: effectiveCategories,
    primary_category,
    tags,
    author: author || post.author,
  };
}

/* =====================================================
   ROUTES
===================================================== */

// GET post by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    const post = await db.collection('posts').findOne({ 
      slug: req.params.slug,
      status: 'published'
    });
    
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    const populated = await populatePost(post, db);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE POST
router.post('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const status = typeof req.body.status === 'string' 
      ? req.body.status.toLowerCase().trim() 
      : 'draft';

    const payload = {
      ...req.body,
      author: req.body.author || req.user._id,
      status,
      publishedAt: status === 'published' ? now : null,
    };

    const post = await Post.create(payload);
    const db = getDB(req.tenantId);
    const enrichedPost = await populatePost(post, db);

    res.status(201).json(enrichedPost || post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET POSTS (LIST) - FIXED WITH FULL COUNTS + PAGINATION
router.get('/', async (req, res) => {
  try {
    const { status, type, author, category, tag, page = 1, limit = 20, sort } = req.query;
    const db = getDB(req.tenantId);
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'All') query.status = status;
    if (type && type !== 'All') query.type = type;
    if (author && ObjectId.isValid(author)) query.author = new ObjectId(author);

    // Category filter
    if (category && category !== 'All') {
      let categoryId = category;
      if (!ObjectId.isValid(category)) {
        const catObj = await db.collection('categories').findOne({ slug: category });
        if (catObj) categoryId = catObj._id;
      }
      if (ObjectId.isValid(categoryId)) {
        const oid = new ObjectId(categoryId);
        query.$or = [{ categories: oid }, { primary_category: oid }];
      }
    }

    // Tag filter
    if (tag && tag !== 'All') {
      let tagId = tag;
      if (!ObjectId.isValid(tag)) {
        const tagObj = await db.collection('tags').findOne({ slug: tag });
        if (tagObj) tagId = tagObj._id;
      }
      if (ObjectId.isValid(tagId)) query.tags = new ObjectId(tagId);
    }

    // Sort
    let sortConfig = { publishedAt: -1, createdAt: -1 };
    if (sort === 'trending' || sort === 'views') sortConfig = { views: -1, title: 1 };
    else if (sort === 'oldest') sortConfig = { publishedAt: 1 };

    // ✅ Accurate total count for the specific query
    const total = await db.collection('posts').countDocuments(query);

    // ✅ Paginated fetch
    const posts = await db.collection('posts')
      .find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const postsWithRelations = await Promise.all(
      posts.map(async (post) => await populatePost(post, db))
    );

    res.json({
      posts: postsWithRelations.filter(Boolean),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DASHBOARD STATS - Accurate counts for Admin Dashboard
router.get('/stats', async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    const [total, published, pending, drafts, archived] = await Promise.all([
      db.collection('posts').countDocuments({}),
      db.collection('posts').countDocuments({ status: 'published' }),
      db.collection('posts').countDocuments({ status: 'pending' }),
      db.collection('posts').countDocuments({ status: 'draft' }),
      db.collection('posts').countDocuments({ status: 'archived' })
    ]);

    res.json({
      totalArticles: total, // Correctly shows 14646
      published,
      pending,
      drafts,
      archived: archived || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET POST BY ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    const query = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { slug: req.params.id };
    const post = await db.collection('posts').findOne(query);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const enrichedPost = await populatePost(post, db);
    res.json(enrichedPost || post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE POST
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    let targetId = req.params.id;
    if (!ObjectId.isValid(targetId)) {
      const found = await db.collection('posts').findOne({ slug: targetId });
      if (!found) return res.status(404).json({ error: 'Post not found' });
      targetId = found._id.toString();
    }
    const post = await Post.update(targetId, req.body);
    const enrichedPost = await populatePost(post, db);
    res.json(enrichedPost || post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH STATUS
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const db = getDB(req.tenantId);
    let targetId = req.params.id;
    if (!ObjectId.isValid(targetId)) {
      const found = await db.collection('posts').findOne({ slug: targetId });
      if (!found) return res.status(404).json({ error: 'Post not found' });
      targetId = found._id.toString();
    }
    const updateData = { status, updatedAt: new Date(), publishedAt: status === 'published' ? new Date() : null };
    const updated = await Post.update(targetId, updateData);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE POST
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    let targetId = req.params.id;
    if (!ObjectId.isValid(targetId)) {
      const found = await db.collection('posts').findOne({ slug: targetId });
      if (!found) return res.status(404).json({ error: 'Post not found' });
      targetId = found._id.toString();
    }
    await Post.delete(targetId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI GENERATION
router.post('/:id/generate-ai', async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    const query = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { slug: req.params.id };
    const post = await db.collection('posts').findOne(query);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const pointers = await generateKeyTakeaways(post.content || post.title);
    if (pointers) await db.collection('posts').updateOne({ _id: post._id }, { $set: { ai_pointers: pointers } });
    res.json({ pointers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;