///routes/posts.js | Route handlers for managing blog posts, including creation, retrieval, updating, and deletion operations. ---
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

// Helper: Populate categories, primary_category, tags, and author with their full objects
async function populatePost(post, db) {
  if (!post) return null;

  // ── categories ──────────────────────────────────────
  let categories = [];
  if (post.categories && post.categories.length > 0) {
    const categoryIds = post.categories
      .map(id => {
        if (id && typeof id === 'object' && id._id) return id; // already populated
        if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
        if (id instanceof ObjectId) return id;
        return null;
      })
      .filter(Boolean);

    if (categoryIds.length > 0) {
      categories = await db
        .collection('categories')
        .find({ _id: { $in: categoryIds } })
        .toArray();
    }
  }

  // ── primary_category ─────────────────────────────────
  let primary_category = [];
  if (post.primary_category && post.primary_category.length > 0) {
    const primaryCatIds = post.primary_category
      .map(id => {
        if (id && typeof id === 'object' && id._id) return id; // already populated
        if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
        if (id instanceof ObjectId) return id;
        return null;
      })
      .filter(Boolean);

    if (primaryCatIds.length > 0) {
      primary_category = await db
        .collection('categories')
        .find({ _id: { $in: primaryCatIds } })
        .toArray();
    }
  }

  // ── tags ─────────────────────────────────────────────
  let tags = [];
  if (post.tags && post.tags.length > 0) {
    const tagIds = post.tags
      .map(id => {
        if (id && typeof id === 'object' && id._id) return id; // already populated
        if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id);
        if (id instanceof ObjectId) return id;
        return null;
      })
      .filter(Boolean);

    if (tagIds.length > 0) {
      tags = await db
        .collection('tags')
        .find({ _id: { $in: tagIds } })
        .toArray();
    }
  }

  // ── author ───────────────────────────────────────────
  let author = null;
  if (post.author) {
    const authorId =
      typeof post.author === 'string' && ObjectId.isValid(post.author)
        ? new ObjectId(post.author)
        : post.author instanceof ObjectId
        ? post.author
        : post.author?._id
        ? post.author // already populated object
        : null;

    if (authorId instanceof ObjectId) {
      author = await db
        .collection('users')
        .findOne({ _id: authorId }, { projection: { password: 0 } });
    }
  }

  // ── merge effective category for urlBuilder ──────────
  const effectiveCategories =
    categories.length > 0 ? categories : primary_category;

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

    const status =
      typeof req.body.status === 'string'
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
   GENERATE AI IMAGE CAPTION (OLLAMA VISION)
===================================================== */
router.post('/generate-caption', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log(`🤖 Generating caption for image: ${imageUrl}`);
    const caption = await generateImageCaption(imageUrl);
    
    res.json({ caption });
  } catch (error) {
    console.error('POST /posts/generate-caption error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   GET POSTS (LIST)
===================================================== */
router.get('/', async (req, res) => {
  try {
    const { status, type, author, category, tag, limit, skip, page } = req.query; // ✅ ADDED: skip and page
    const db = getDB(req.tenantId);

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (author && ObjectId.isValid(author)) query.author = new ObjectId(author);

    // Filter by Category (slug or ID)
    if (category) {
      let categoryId = category;
      if (!ObjectId.isValid(category)) {
        const catObj = await db.collection('categories').findOne({ slug: category });
        if (catObj) {
          categoryId = catObj._id;
        } else {
          query.categories = { $in: [] };
        }
      }
      if (ObjectId.isValid(categoryId) && !query.categories) {
        const oid = new ObjectId(categoryId);
        query.$or = [
          { categories: oid },
          { primary_category: oid },
        ];
      }
    }

    // Filter by Tag (slug or ID)
    if (tag) {
      let tagId = tag;
      if (!ObjectId.isValid(tag)) {
        const tagObj = await db.collection('tags').findOne({ slug: tag });
        if (tagObj) {
          tagId = tagObj._id;
        } else {
          query.tags = { $in: [] };
        }
      }
      if (ObjectId.isValid(tagId) && !query.tags) {
        query.tags = new ObjectId(tagId);
      }
    }

    // Filter by previous slug (for 301 redirects)
    if (req.query.previousSlug) {
      query.previousSlugs = req.query.previousSlug;
    }

    console.log('📋 GET /posts query:', JSON.stringify(query));

    // Sort configuration
    let sortConfig = { publishedAt: -1, createdAt: -1 };

    if (req.query.sort === 'trending' || req.query.sort === 'views') {
      sortConfig = { views: -1, title: 1 };
    } else if (req.query.sort === 'oldest') {
      sortConfig = { publishedAt: 1 };
    }

    // ✅ FIXED: limit, skip, and page support
    const limitVal = limit ? parseInt(limit, 10) : 20;
    const pageVal = page ? parseInt(page, 10) : 1;
    const skipVal = skip
      ? parseInt(skip, 10)
      : page
      ? (pageVal - 1) * limitVal
      : 0;

    let cursor = db.collection('posts').find(query).sort(sortConfig);

    if (!isNaN(skipVal) && skipVal > 0) {
      cursor = cursor.skip(skipVal);
    }

    if (!isNaN(limitVal) && limitVal > 0) {
      cursor = cursor.limit(limitVal);
    }

    const posts = await cursor.toArray();
    console.log(`✅ Found ${posts.length} posts (skip=${skipVal}, limit=${limitVal})`);

    const postsWithRelations = await Promise.all(
      posts.map(async (post) => {
        const enriched = await populatePost(post, db);
        return enriched || post;
      })
    );

    res.json(postsWithRelations);
  } catch (error) {
    console.error('GET /posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   GET POST BY ID
===================================================== */
router.get('/:id', async (req, res) => {
  try {
    const db = getDB(req.tenantId);

    const mockPost = MOCK_POSTS.find(p => p.slug === req.params.id || p._id === req.params.id);
    if (mockPost) {
      console.log('⚠️ Serving MOCK data for known post:', req.params.id);
      return res.json(mockPost);
    }

    if (!db) {
      console.warn('⚠️ Database unavailable. Serving MOCK data for GET /posts/:id.');
      return res.status(404).json({ error: 'Post not found (Mock Mode)' });
    }

    let query;
    if (ObjectId.isValid(req.params.id)) {
      query = { _id: new ObjectId(req.params.id) };
    } else {
      query = { slug: req.params.id };
    }

    const post = await db.collection('posts').findOne(query);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    console.log('🔍 GET /posts/:id', req.params.id);

    const enrichedPost = await populatePost(post, db);

    if (enrichedPost?.categories?.length) {
      console.log('✅ Loaded categories:', enrichedPost.categories.map(c => c.name).join(', '));
    }
    if (enrichedPost?.primary_category?.length) {
      console.log('✅ Loaded primary_category:', enrichedPost.primary_category.map(c => c.name).join(', '));
    }
    if (enrichedPost?.tags?.length) {
      console.log('✅ Loaded tags:', enrichedPost.tags.map(t => t.name).join(', '));
    }
    if (enrichedPost?.author?.name) {
      console.log('✅ Loaded author:', enrichedPost.author.name);
    }

    console.log('📤 Returning post with populated relations');
    res.json(enrichedPost || post);
  } catch (error) {
    console.error('GET /posts/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   UPDATE POST CONTENT
===================================================== */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const db = getDB(req.tenantId);

    if (req.params.id === 'new') {
      console.log('✨ PUT /posts/new detected - creating new post');
      const now = new Date();
      const status =
        typeof req.body.status === 'string'
          ? req.body.status.toLowerCase().trim()
          : 'draft';

      const payload = {
        ...req.body,
        status,
        publishedAt: status === 'published' ? now : null,
      };

      const post = await Post.create(payload);
      if (post?.error) return res.status(400).json({ error: post.error });

      const enrichedPost = await populatePost(post, db);
      return res.status(201).json(enrichedPost || post);
    }

    console.log('✏️ PUT /posts/:id', req.params.id);

    let targetId = req.params.id;
    if (!ObjectId.isValid(targetId)) {
      const foundBySlug = await db.collection('posts').findOne({ slug: targetId });
      if (!foundBySlug) {
        return res.status(404).json({ error: 'Post not found' });
      }
      targetId = foundBySlug._id.toString();
    }

    const post = await Post.update(targetId, req.body);
    if (post?.error) {
      if (post.error === 'Post not found') {
        return res.status(404).json({ error: post.error });
      }
      return res.status(400).json({ error: post.error });
    }

    const enrichedPost = await populatePost(post, db);

    console.log('✅ Post updated successfully');
    res.json(enrichedPost || post);
  } catch (error) {
    console.error('PUT /posts/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   UPDATE POST STATUS (EDITORIAL FLOW)
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
      return res.status(403).json({
        error: 'Only editors or admins can publish or revert posts',
      });
    }

    if (status !== 'pending' && !requireEditorOrAdmin(req, res)) return;

    let targetId = req.params.id;
    let post = null;
    if (ObjectId.isValid(targetId)) {
      post = await Post.findById(targetId);
    } else {
      const foundBySlug = await db.collection('posts').findOne({ slug: targetId });
      if (!foundBySlug) {
        return res.status(404).json({ error: 'Post not found' });
      }
      targetId = foundBySlug._id.toString();
      post = foundBySlug;
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
      await notifyAuthor(db, post.author, 'Your post has been approved and published', post._id);
    }

    if (status === 'draft') {
      await notifyAuthor(db, post.author, 'Your post was sent back to drafts by the editor', post._id);
    }

    res.json({
      _id: updated._id,
      status: updated.status,
      publishedAt: updated.publishedAt,
      approvedBy: updated.approvedBy || null,
      approvedAt: updated.approvedAt || null,
    });
  } catch (error) {
    console.error('PATCH /posts/:id/status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   BULK APPROVE (EDITOR / ADMIN)
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
        },
      }
    );

    const approvedPosts = await db
      .collection('posts')
      .find({ _id: { $in: validIds } })
      .toArray();

    for (const post of approvedPosts) {
      await notifyAuthor(db, post.author, 'Your post has been approved and published', post._id);
    }

    console.log(`✅ Bulk approved ${result.modifiedCount} posts`);
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
    console.log('🗑️ DELETE /posts/:id', req.params.id);

    const db = getDB(req.tenantId);
    let targetId = req.params.id;
    if (!ObjectId.isValid(targetId)) {
      const foundBySlug = await db.collection('posts').findOne({ slug: targetId });
      if (!foundBySlug) {
        return res.status(404).json({ error: 'Post not found' });
      }
      targetId = foundBySlug._id.toString();
    }

    const result = await Post.delete(targetId);
    if (result?.error) return res.status(400).json({ error: result.error });

    console.log('✅ Post deleted successfully');
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('DELETE /posts/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* =====================================================
   GENERATE AI KEY TAKEAWAYS (OLLAMA)
===================================================== */
router.post('/:id/generate-ai', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB(req.tenantId);

    if (!db) {
      console.log('⚠️ DB not connected. Generating AI for MOCK POST.');
      const mockPost = MOCK_POSTS.find(p => p.slug === id || p._id === id);
      if (!mockPost) return res.status(404).json({ error: 'Post not found (Mock)' });

      const contentToAnalyze = mockPost.content || mockPost.summary || mockPost.title;
      const pointers = await generateKeyTakeaways(contentToAnalyze);

      if (pointers && pointers.length > 0) {
        mockPost.ai_pointers = pointers;
      }
      return res.json({ pointers });
    }

    let query;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { slug: id };
    }

    const post = await db.collection('posts').findOne(query);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const contentToAnalyze = post.content || post.summary || post.title;
    console.log(`🤖 Generating AI pointers for: ${post.title}`);

    const pointers = await generateKeyTakeaways(contentToAnalyze);

    if (
      pointers &&
      pointers.length > 0 &&
      !pointers[0].startsWith('Error') &&
      !pointers[0].startsWith('Could not')
    ) {
      await db.collection('posts').updateOne(
        { _id: post._id },
        { $set: { ai_pointers: pointers } }
      );
      console.log('✅ AI pointers saved to DB');
    }

    res.json({ pointers });
  } catch (error) {
    console.error('POST /posts/:id/generate-ai error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;