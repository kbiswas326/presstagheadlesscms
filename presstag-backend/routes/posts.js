/// routes/posts.js | Route handlers for managing blog posts
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const { generateKeyTakeaways, generateImageCaption } = require('../utils/ai');
const MOCK_POSTS = require('./mock_posts');

// GET post by slug — must be before /:id route
router.get('/slug/:slug', async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    const post = await db.collection('posts').findOne({ 
      slug: req.params.slug,
      status: 'published'
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const populated = await populatePost(post, db);
    res.json(populated);
  } catch (err) {
    console.error('Get post by slug error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =====================================================
   HELPERS
===================================================== */
function requireEditorOrAdmin(req, res) {
  if (!req.user || !['admin', 'editor'].includes(req.user.role)) {
    res.status(403).json({
      error: 'You do not have permission to perform this action',
    });
    return false;
  }
  return true;
}

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

// Helper: Populate categories, primary_category, tags, and author
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
   CREATE POST
===================================================== */
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
    if (post?.error) return res.status(400).json({ error: post.error });

    const db = getDB(req.tenantId);
    const enrichedPost = await populatePost(post, db);

    res.status(201).json(enrichedPost || post);
  } catch (error) {
    console.error('POST /posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   GENERATE AI IMAGE CAPTION
===================================================== */
router.post('/generate-caption', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });

    const caption = await generateImageCaption(imageUrl);
    res.json({ caption });
  } catch (error) {
    console.error('POST /posts/generate-caption error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   GET POSTS (LIST) - FIXED WITH FULL COUNTS + PAGINATION
===================================================== */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      author, 
      category, 
      tag, 
      page = 1, 
      limit = 20,
      sort 
    } = req.query;

    const db = getDB(req.tenantId);
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (author && ObjectId.isValid(author)) query.author = new ObjectId(author);

    // Category filter
    if (category) {
      let categoryId = category;
      if (!ObjectId.isValid(category)) {
        const catObj = await db.collection('categories').findOne({ slug: category });
        if (catObj) categoryId = catObj._id;
        else query.categories = { $in: [] };
      }
      if (ObjectId.isValid(categoryId)) {
        const oid = new ObjectId(categoryId);
        query.$or = [{ categories: oid }, { primary_category: oid }];
      }
    }

    // Tag filter
    if (tag) {
      let tagId = tag;
      if (!ObjectId.isValid(tag)) {
        const tagObj = await db.collection('tags').findOne({ slug: tag });
        if (tagObj) tagId = tagObj._id;
        else query.tags = { $in: [] };
      }
      if (ObjectId.isValid(tagId)) {
        query.tags = new ObjectId(tagId);
      }
    }

    if (req.query.previousSlug) {
      query.previousSlugs = req.query.previousSlug;
    }

    // Sort
    let sortConfig = { publishedAt: -1, createdAt: -1 };
    if (sort === 'trending' || sort === 'views') {
      sortConfig = { views: -1, title: 1 };
    } else if (sort === 'oldest') {
      sortConfig = { publishedAt: 1 };
    }

    // Get accurate total count (Critical fix for SportzPoint 14k+ articles)
    const total = await db.collection('posts').countDocuments(query);

    // Get paginated posts
    const posts = await db.collection('posts')
      .find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    console.log(`✅ Found ${posts.length} posts | Total: ${total} | Page: ${pageNum}`);

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
    console.error('GET /posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   DASHBOARD STATS - Accurate counts for Admin Dashboard
===================================================== */
router.get('/stats', async (req, res) => {
  try {
    const db = getDB(req.tenantId);

    const baseQuery = {};

    const [
      totalArticles,
      published,
      pending,
      drafts,
      archived,
      articleTypes
    ] = await Promise.all([
      db.collection('posts').countDocuments(baseQuery),
      db.collection('posts').countDocuments({ ...baseQuery, status: 'published' }),
      db.collection('posts').countDocuments({ ...baseQuery, status: 'pending' }),
      db.collection('posts').countDocuments({ ...baseQuery, status: 'draft' }),
      db.collection('posts').countDocuments({ ...baseQuery, status: 'archived' }),
      db.collection('posts').distinct('type', baseQuery)
    ]);

    res.json({
      totalArticles,
      published,
      pending,
      drafts,
      archived: archived || 0,
      totalTypes: articleTypes.length,
      types: articleTypes
    });
  } catch (error) {
    console.error('GET /posts/stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   GET POST BY ID
===================================================== */
router.get('/:id', async (req, res) => {
  try {
    const db = getDB(req.tenantId);

    const baseQuery = {};

    const [
      totalArticles,
      published,
      pending,
      drafts,
      archived,
      articleTypes
    ] = await Promise.all([
      db.collection('posts').countDocuments(baseQuery),
      db.collection('posts').countDocuments({ ...baseQuery, status: 'published' }),
      db.collection('posts').countDocuments({ ...baseQuery, status: 'pending' }),
      db.collection('posts').countDocuments({ ...baseQuery, status: 'draft' }),
      db.collection('posts').countDocuments({ ...baseQuery, status: 'archived' }),
      db.collection('posts').distinct('type', baseQuery)
    ]);

    res.json({
      totalArticles,     // Will show 14646 for SportzPoint
      published,
      pending,
      drafts,
      archived: archived || 0,
      totalTypes: articleTypes.length,
      types: articleTypes
    });
  } catch (error) {
    console.error('GET /posts/stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   UPDATE POST CONTENT
===================================================== */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    const now = new Date();

    let targetId = req.params.id;
    if (req.params.id === 'new') {
      const status = typeof req.body.status === 'string' ? req.body.status.toLowerCase().trim() : 'draft';
      const payload = { ...req.body, status, publishedAt: status === 'published' ? now : null };
      const post = await Post.create(payload);
      if (post?.error) return res.status(400).json({ error: post.error });

      const enriched = await populatePost(post, db);
      return res.status(201).json(enriched || post);
    }

    if (!ObjectId.isValid(targetId)) {
      const found = await db.collection('posts').findOne({ slug: targetId });
      if (!found) return res.status(404).json({ error: 'Post not found' });
      targetId = found._id.toString();
    }

    const post = await Post.update(targetId, req.body);
    if (post?.error) return res.status(400).json({ error: post.error });

    const enrichedPost = await populatePost(post, db);
    res.json(enrichedPost || post);
  } catch (error) {
    console.error('PUT /posts/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   UPDATE POST STATUS
===================================================== */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const db = getDB(req.tenantId);

    if (!['draft', 'pending', 'published'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const isEditorOrAdmin = ['admin', 'editor'].includes(req.user.role);
    if (!isEditorOrAdmin && status !== 'pending') {
      return res.status(403).json({ error: 'Only editors or admins can publish' });
    }

    let targetId = req.params.id;
    if (!ObjectId.isValid(targetId)) {
      const found = await db.collection('posts').findOne({ slug: targetId });
      if (!found) return res.status(404).json({ error: 'Post not found' });
      targetId = found._id.toString();
    }

    const updateData = {
      status,
      publishedAt: status === 'published' ? new Date() : null,
      updatedAt: new Date(),
    };

    if (status === 'published') {
      updateData.approvedBy = new ObjectId(req.user._id);
      updateData.approvedAt = new Date();
    }
    if (status === 'draft') {
      updateData.approvedBy = null;
      updateData.approvedAt = null;
    }

    const updated = await Post.update(targetId, updateData);
    if (updated?.error) return res.status(400).json({ error: updated.error });

    if (status === 'published') {
      await notifyAuthor(db, updated.author, 'Your post has been approved and published', updated._id);
    }
    if (status === 'draft') {
      await notifyAuthor(db, updated.author, 'Your post was sent back to drafts', updated._id);
    }

    res.json(updated);
  } catch (error) {
    console.error('PATCH /posts/:id/status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   BULK APPROVE
===================================================== */
router.patch('/bulk/approve', authMiddleware, async (req, res) => {
  try {
    if (!requireEditorOrAdmin(req, res)) return;

    const { postIds } = req.body;
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'No post IDs provided' });
    }

    const db = getDB(req.tenantId);
    const validIds = postIds
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    const now = new Date();

    const result = await db.collection('posts').updateMany(
      { _id: { $in: validIds }, status: 'pending' },
      {
        $set: {
          status: 'published',
          publishedAt: now,
          approvedBy: new ObjectId(req.user._id),
          approvedAt: now,
          updatedAt: now,
        }
      }
    );

    res.json({ approvedCount: result.modifiedCount });
  } catch (error) {
    console.error('PATCH /posts/bulk/approve error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   DELETE POST
===================================================== */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB(req.tenantId);
    let targetId = req.params.id;

    if (!ObjectId.isValid(targetId)) {
      const found = await db.collection('posts').findOne({ slug: targetId });
      if (!found) return res.status(404).json({ error: 'Post not found' });
      targetId = found._id.toString();
    }

    const result = await Post.delete(targetId);
    if (result?.error) return res.status(400).json({ error: result.error });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('DELETE /posts/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   GENERATE AI KEY TAKEAWAYS
===================================================== */
router.post('/:id/generate-ai', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB(req.tenantId);

    if (!db) {
      const mockPost = MOCK_POSTS.find(p => p.slug === id || p._id === id);
      if (!mockPost) return res.status(404).json({ error: 'Post not found' });
      return res.json({ pointers: [] });
    }

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { slug: id };
    const post = await db.collection('posts').findOne(query);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const contentToAnalyze = post.content || post.summary || post.title;
    const pointers = await generateKeyTakeaways(contentToAnalyze);

    if (pointers && pointers.length > 0) {
      await db.collection('posts').updateOne(
        { _id: post._id },
        { $set: { ai_pointers: pointers } }
      );
    }

    res.json({ pointers });
  } catch (error) {
    console.error('POST /posts/:id/generate-ai error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;