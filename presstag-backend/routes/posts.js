/// routes/posts.js | This file defines the Express router for handling all post-related API endpoints in the PressTag backend. It includes routes for creating, reading, updating, and deleting posts, as well as fetching posts by slug and generating AI content. The router uses a helper function to populate related data (categories, tags, author) for each post. It also includes a stats endpoint to provide accurate counts of posts by status for the admin dashboard. The routes are protected with authentication middleware where necessary.
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const { generateKeyTakeaways, generateImageCaption } = require('../utils/ai');

/* =====================================================
   HELPERS
===================================================== */

// Helper: Populate categories, primary_category, tags, and author
async function populatePost(post, db) {
  if (!post) return null;

  const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof ObjectId) return value;
    if (typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value);
    if (typeof value === 'object') {
      const candidate = value._id || value.id;
      if (candidate instanceof ObjectId) return candidate;
      if (typeof candidate === 'string' && ObjectId.isValid(candidate)) return new ObjectId(candidate);
    }
    return null;
  };

  const primaryCategoryIds = Array.isArray(post.primary_category)
    ? post.primary_category.map((v) => (v ? String(v._id || v) : '')).filter(Boolean)
    : post.primary_category
      ? [String(post.primary_category._id || post.primary_category)]
      : [];

  // categories
  let categories = [];
  const rawCategories = Array.isArray(post.categories) ? post.categories : [];
  if (rawCategories.length > 0) {
    const categoryIds = [];
    const categorySlugs = [];
    const categoryObjects = [];

    for (const c of rawCategories) {
      if (c && typeof c === 'object' && (c.name || c.slug) && !c._id) {
        categoryObjects.push(c);
        continue;
      }
      const oid = toObjectId(c);
      if (oid) {
        categoryIds.push(oid);
        continue;
      }
      if (typeof c === 'string') categorySlugs.push(c);
      else if (c && typeof c === 'object' && typeof c.slug === 'string') categorySlugs.push(c.slug);
    }

    const fetchedById = categoryIds.length > 0
      ? await db.collection('categories').find({ _id: { $in: categoryIds } }).toArray()
      : [];

    const fetchedBySlug = categorySlugs.length > 0
      ? await db.collection('categories').find({ slug: { $in: categorySlugs } }).toArray()
      : [];

    categories = [...fetchedById, ...fetchedBySlug];
    if (categories.length === 0 && categoryObjects.length > 0) categories = categoryObjects;
    if (categories.length === 0 && categorySlugs.length > 0) {
      categories = categorySlugs.map((slug) => ({ slug, name: slug }));
    }
  }

  let primaryCategory = null;
  const rawPrimary = Array.isArray(post.primary_category) ? post.primary_category[0] : post.primary_category;
  const primaryCategoryId = toObjectId(rawPrimary);
  if (primaryCategoryId) {
    primaryCategory = await db.collection('categories').findOne({ _id: primaryCategoryId });
  } else if (typeof rawPrimary === 'string') {
    primaryCategory = await db.collection('categories').findOne({ slug: rawPrimary });
  }

  if ((!categories || categories.length === 0) && primaryCategory) {
    categories = [primaryCategory];
  }

  if ((!categories || categories.length === 0) && post.category) {
    const categoryId = toObjectId(post.category);
    if (categoryId) {
      const c = await db.collection('categories').findOne({ _id: categoryId });
      if (c) categories = [c];
    } else if (typeof post.category === 'string') {
      const c = await db.collection('categories').findOne({ slug: post.category });
      if (c) categories = [c];
    }
  }

  // tags
  let tags = [];
  const rawTags = Array.isArray(post.tags) ? post.tags : [];
  if (rawTags.length > 0) {
    const tagIds = [];
    const tagSlugs = [];

    for (const t of rawTags) {
      const oid = toObjectId(t);
      if (oid) {
        tagIds.push(oid);
        continue;
      }
      if (typeof t === 'string') tagSlugs.push(t);
      else if (t && typeof t === 'object' && typeof t.slug === 'string') tagSlugs.push(t.slug);
    }

    const fetchedById = tagIds.length > 0
      ? await db.collection('tags').find({ _id: { $in: tagIds } }).toArray()
      : [];

    const fetchedBySlug = tagSlugs.length > 0
      ? await db.collection('tags').find({ slug: { $in: tagSlugs } }).toArray()
      : [];

    tags = [...fetchedById, ...fetchedBySlug];
    if (tags.length === 0 && tagSlugs.length > 0) {
      tags = tagSlugs.map((slug) => ({ slug, name: slug }));
    }
  }

  // author
  let author = null;
  const rawAuthor = post.author || post.authorId || post.userId || post.createdBy;
  if (rawAuthor) {
    const authorId = toObjectId(rawAuthor);

    if (authorId) {
      author = await db.collection('users')
        .findOne({ _id: authorId }, { projection: { password: 0 } });
    } else if (typeof rawAuthor === 'string') {
      author = await db.collection('users')
        .findOne({ slug: rawAuthor }, { projection: { password: 0 } });
    }
  }

  return {
    ...post,
    categories,
    tags,
    primary_category: primaryCategoryIds,
    author: author || post.author,
  };
}

/* =====================================================
   ROUTES
===================================================== */

router.get('/__debug/raw/:id', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  try {
    const db = getDB(req.tenantId);
    const post = await db.collection('posts').findOne({ _id: new ObjectId(req.params.id) });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({
      _id: post._id,
      slug: post.slug,
      categories: post.categories,
      primary_category: post.primary_category,
      category: post.category,
      author: post.author,
      authorName: post.authorName,
      tags: post.tags,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// GET POSTS (LIST) - FIXED WITH FULL COUNTS + PAGINATION
router.get('/', async (req, res) => {
  try {
    const { 
      status, type, author, category, tag, 
      page = 1, limit = 20, sort, search 
    } = req.query;

    const db = getDB(req.tenantId);
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'All') query.status = status;
    if (type && type !== 'All') query.type = type;
    if (search) query.title = { $regex: search, $options: 'i' };
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

    // Sort
    let sortConfig = { publishedAt: -1, createdAt: -1 };
    if (sort === 'trending') sortConfig = { views: -1 };

    // ✅ 1. Get accurate total count for the SPECIFIC query (Crucial for 14k+ articles)
    const total = await db.collection('posts').countDocuments(query);

    const postsWithRelations = await db.collection('posts').aggregate([
      { $match: query },
      { $sort: sortConfig },
      { $skip: skip },
      { $limit: limitNum },
      { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categoriesPop' } },
      { $lookup: { from: 'categories', localField: 'primary_category', foreignField: '_id', as: 'primaryCategoryPop' } },
      { $lookup: { from: 'tags', localField: 'tags', foreignField: '_id', as: 'tagsPop' } },
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorPop' } },
      {
        $addFields: {
          categories: {
            $cond: [
              { $gt: [{ $size: '$categoriesPop' }, 0] },
              '$categoriesPop',
              '$primaryCategoryPop',
            ],
          },
          tags: '$tagsPop',
          author: { $arrayElemAt: ['$authorPop', 0] },
        },
      },
      { $project: { categoriesPop: 0, primaryCategoryPop: 0, tagsPop: 0, authorPop: 0, 'author.password': 0 } },
    ]).toArray();

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
      totalArticles: total, // Correctly shows 14646 for SportzPoint
      published,
      pending,
      drafts,
      archived: archived || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE POST
router.post('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const status = typeof req.body.status === 'string' ? req.body.status.toLowerCase().trim() : 'draft';
    const payload = {
      ...req.body,
      author: req.body.author || req.user._id,
      status,
      publishedAt: status === 'published' ? now : null,
    };
    const post = await Post.create(payload, req.tenantId);
    const db = getDB(req.tenantId);
    const enrichedPost = await populatePost(post, db);
    res.status(201).json(enrichedPost || post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET POST BY ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    const query = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { slug: req.params.id };
    const rows = await db.collection('posts').aggregate([
      { $match: query },
      { $limit: 1 },
      { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categoriesPop' } },
      { $lookup: { from: 'categories', localField: 'primary_category', foreignField: '_id', as: 'primaryCategoryPop' } },
      { $lookup: { from: 'tags', localField: 'tags', foreignField: '_id', as: 'tagsPop' } },
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorPop' } },
      {
        $addFields: {
          categories: {
            $cond: [
              { $gt: [{ $size: '$categoriesPop' }, 0] },
              '$categoriesPop',
              '$primaryCategoryPop',
            ],
          },
          tags: '$tagsPop',
          author: { $arrayElemAt: ['$authorPop', 0] },
        },
      },
      { $project: { categoriesPop: 0, primaryCategoryPop: 0, tagsPop: 0, authorPop: 0, 'author.password': 0 } },
    ]).toArray();

    const post = rows[0];
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
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
    const post = await Post.update(targetId, req.body, req.tenantId);
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
    const updated = await Post.update(targetId, updateData, req.tenantId);
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
    await Post.delete(targetId, req.tenantId);
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
