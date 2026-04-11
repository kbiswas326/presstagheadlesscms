/// routes/posts.js | This file defines the Express router for handling all post-related API endpoints in the PressTag backend. It includes routes for creating, reading, updating, and deleting posts, as well as fetching posts by slug and generating AI content. The router uses a helper function to populate related data (categories, tags, author) for each post. It also includes a stats endpoint to provide accurate counts of posts by status for the admin dashboard. The routes are protected with authentication middleware where necessary.
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');
const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const { generateKeyTakeaways, generateImageCaption } = require('../utils/ai');
const webPush = require('web-push');
const { configureWebPush } = require('./push');

/* =====================================================
   HELPERS
===================================================== */

async function sendTenantPush(tenantId, payload) {
  const cfg = configureWebPush();
  if (!cfg) return;
  const candidates = [
    String(tenantId || '').trim(),
    String(process.env.DEFAULT_TENANT_ID || '').trim(),
    'sportzpoint',
    'presstag',
  ].filter(Boolean);
  const orderedTenants = Array.from(new Set(candidates));

  const allSubs = [];
  const seenEndpoints = new Set();
  for (const t of orderedTenants) {
    const db = getDB(t);
    if (!db) continue;
    const subs = await db.collection('pushSubscriptions').find({}).toArray();
    for (const sub of subs) {
      const endpoint = String(sub?.endpoint || '');
      if (!endpoint || seenEndpoints.has(endpoint)) continue;
      if (sub?.allowed === false) continue;
      seenEndpoints.add(endpoint);
      allSubs.push({ tenantId: t, sub });
    }
  }
  if (!allSubs.length) return;

  const message = JSON.stringify(payload);
  await Promise.allSettled(
    allSubs.map(async ({ tenantId: t, sub }) => {
      try {
        await webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, message);
      } catch (err) {
        const code = err?.statusCode || err?.status;
        if (code === 404 || code === 410) {
          try { await getDB(t)?.collection('pushSubscriptions')?.deleteOne?.({ endpoint: sub.endpoint }); } catch {}
        }
      }
    })
  );
}

function stripHtmlToText(input) {
  const html = String(input || '');
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getNotificationImage(post) {
  const candidate =
    post?.featuredImage?.url ||
    post?.featuredImage ||
    post?.banner_image?.url ||
    post?.banner_image ||
    post?.coverImage?.url ||
    post?.coverImage ||
    '';
  return typeof candidate === 'string' ? candidate : (candidate?.url || '');
}

function buildPostSnippet(post) {
  const summary = String(post?.summary || post?.excerpt || '').trim();
  if (summary) return summary.length > 160 ? `${summary.slice(0, 157)}...` : summary;

  const text = stripHtmlToText(post?.content || '');
  if (!text) return '';
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function getIstDateParts(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return { publishDate: null, publishTime: null };
  try {
    const dateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const timeParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);

    const y = dateParts.find((p) => p.type === 'year')?.value;
    const m = dateParts.find((p) => p.type === 'month')?.value;
    const day = dateParts.find((p) => p.type === 'day')?.value;
    const h = timeParts.find((p) => p.type === 'hour')?.value;
    const min = timeParts.find((p) => p.type === 'minute')?.value;
    if (!y || !m || !day || h == null || min == null) return { publishDate: null, publishTime: null };
    return { publishDate: `${y}-${m}-${day}`, publishTime: `${h}:${min}` };
  } catch {
    return { publishDate: null, publishTime: null };
  }
}

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

  const rawAuthors = Array.isArray(post.authors) ? post.authors : [];
  const authorIds = rawAuthors.map((v) => toObjectId(v)).filter(Boolean);
  const authors = authorIds.length > 0
    ? await db.collection('users').find({ _id: { $in: authorIds } }, { projection: { password: 0 } }).toArray()
    : [];

  const primaryAuthorId = author ? String(author._id) : (rawAuthor ? String(rawAuthor._id || rawAuthor) : '');
  const authorById = new Map(authors.map((u) => [String(u._id), u]));
  const orderedAuthors = authorIds
    .map((id) => authorById.get(String(id)))
    .filter(Boolean);

  const mergedAuthors = orderedAuthors.length > 0
    ? (
        primaryAuthorId
          ? [
              ...(authorById.get(primaryAuthorId) ? [authorById.get(primaryAuthorId)] : (author ? [author] : [])),
              ...orderedAuthors.filter((u) => String(u._id) !== String(primaryAuthorId)),
            ]
          : orderedAuthors
      )
    : (author ? [author] : []);

  let editor = null;
  const rawEditor = post.editor || post.editorId;
  const editorId = rawEditor ? toObjectId(rawEditor) : null;
  if (rawEditor) {
    if (editorId) {
      editor = await db.collection('users').findOne({ _id: editorId }, { projection: { password: 0 } });
    }
  }

  if (editor && author && String(editor._id) === String(author._id)) editor = null;
  if (!editor && editorId && post.editorName) {
    editor = { _id: editorId, name: post.editorName };
  }

  if (primaryCategory && Array.isArray(categories) && categories.length > 0) {
    const primaryId = String(primaryCategory._id);
    categories = [
      primaryCategory,
      ...categories.filter((c) => String(c?._id) !== primaryId),
    ];
  }

  return {
    ...post,
    categories,
    tags,
    primary_category: primaryCategoryIds,
    author: author || post.author,
    authors: mergedAuthors,
    editor: editor || post.editor,
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
      status: 'published',
    });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const populated = await populatePost(post, db);
    res.json(populated || post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET POSTS (LIST) - FIXED WITH FULL COUNTS + PAGINATION
router.get('/', async (req, res) => {
  try {
    const { 
      status, type, author, category, tag, 
      page = 1, limit = 20, sort, search, previousSlug, lite
    } = req.query;

    const db = getDB(req.tenantId);
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const liteMode = ['1', 'true', 'yes'].includes(String(lite || '').toLowerCase().trim());

    const query = {};
    const and = [];
    if (status && status !== 'All') query.status = status;
    if (type && type !== 'All') {
      const rawType = String(type || '');
      const normalizedType = rawType.toLowerCase().trim();
      const typeVariantsByCanonical = {
        article: ['article', 'Article'],
        video: ['video', 'Video'],
        'photo-gallery': ['photo-gallery', 'photo gallery', 'Photo Gallery', 'photoGallery', 'photo_gallery'],
        'web-story': ['web-story', 'web story', 'Web Story', 'webStory', 'WebStory', 'story', 'Story'],
        'live-blog': ['live-blog', 'live blog', 'Live Blog', 'LiveBlog', 'liveblog'],
      };
      const variants = typeVariantsByCanonical[normalizedType];
      query.type = variants ? { $in: variants } : rawType;
    }
    if (search) query.title = { $regex: search, $options: 'i' };
    if (previousSlug && typeof previousSlug === 'string' && previousSlug.trim()) {
      query.previousSlugs = previousSlug.trim();
    }
    if (author && author !== 'All') {
      const authorRaw = String(author || '').trim();
      const authorValue = authorRaw.replace(/^#/, '').toLowerCase();
      let authorId = null;
      if (ObjectId.isValid(authorValue)) {
        authorId = new ObjectId(authorValue);
      } else if (authorValue) {
        const bySlug =
          await db.collection('users').findOne({ slug: authorValue }, { projection: { _id: 1 } }) ||
          await db.collection('users').findOne({ slug: authorRaw }, { projection: { _id: 1 } });
        if (bySlug?._id) authorId = bySlug._id;
        if (!authorId) {
          const byName = await db.collection('users').findOne(
            { name: { $regex: `^${authorRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
            { projection: { _id: 1 } }
          );
          if (byName?._id) authorId = byName._id;
        }
      }
      if (authorId) {
        and.push({ $or: [{ author: authorId }, { authors: authorId }] });
      }
    }

    // Category filter
    if (category && category !== 'All') {
      const categoryValueRaw = String(category).trim();
      const categoryValue = categoryValueRaw.replace(/^#/, '').toLowerCase();
      let categoryId = categoryValue;
      if (!ObjectId.isValid(categoryId)) {
        const catObj =
          await db.collection('categories').findOne({ slug: categoryValue }) ||
          await db.collection('categories').findOne({ slug: categoryValueRaw });
        if (catObj?._id) categoryId = catObj._id;
      }
      if (ObjectId.isValid(categoryId)) {
        const oid = new ObjectId(categoryId);
        and.push({ $or: [{ categories: oid }, { primary_category: oid }] });
      }
    }

    if (tag && tag !== 'All') {
      const tagValueRaw = String(tag).trim();
      const tagValue = tagValueRaw.replace(/^#/, '').toLowerCase();
      if (tagValue) {
        const ors = [];
        if (ObjectId.isValid(tagValue)) {
          ors.push({ tags: new ObjectId(tagValue) });
        } else {
          const tagObj =
            await db.collection('tags').findOne({ slug: tagValue }, { projection: { _id: 1 } }) ||
            await db.collection('tags').findOne({ slug: tagValueRaw }, { projection: { _id: 1 } });
          if (tagObj?._id) ors.push({ tags: tagObj._id });
          ors.push({ tags: tagValue });
        }
        if (ors.length > 0) and.push({ $or: ors });
      }
    }

    if (and.length > 0) query.$and = and;

    // Sort
    let sortConfig = { publishedAt: -1, createdAt: -1 };
    if (sort === 'trending') sortConfig = { views: -1 };

    // ✅ 1. Get accurate total count for the SPECIFIC query (Crucial for 14k+ articles)
    const total = await db.collection('posts').countDocuments(query);

    const pipeline = [{ $match: query }];

    if (liteMode) {
      pipeline.push({
        $project: {
          content: 0,
          excerpt: 0,
          images: 0,
          stories: 0,
          liveUpdates: 0,
          seo: 0,
        },
      });
    }

    pipeline.push(
      { $sort: sortConfig },
      { $skip: skip },
      { $limit: limitNum },
      { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categoriesPop' } },
      { $lookup: { from: 'categories', localField: 'primary_category', foreignField: '_id', as: 'primaryCategoryPop' } },
      { $lookup: { from: 'tags', localField: 'tags', foreignField: '_id', as: 'tagsPop' } },
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorPop' } },
      { $lookup: { from: 'users', localField: 'authors', foreignField: '_id', as: 'authorsPop' } },
      { $lookup: { from: 'users', localField: 'editor', foreignField: '_id', as: 'editorPop' } },
      {
        $addFields: {
          categories: {
            $cond: [
              { $gt: [{ $size: '$categoriesPop' }, 0] },
              {
                $filter: {
                  input: {
                    $map: {
                      input: '$categories',
                      as: 'cid',
                      in: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$categoriesPop',
                              as: 'c',
                              cond: { $eq: ['$$c._id', '$$cid'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                  as: 'c',
                  cond: { $ne: ['$$c', null] },
                },
              },
              '$primaryCategoryPop',
            ],
          },
          tags: '$tagsPop',
          author: { $arrayElemAt: ['$authorPop', 0] },
          authors: {
            $cond: [
              { $gt: [{ $size: '$authorsPop' }, 0] },
              {
                $filter: {
                  input: {
                    $map: {
                      input: '$authors',
                      as: 'aid',
                      in: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$authorsPop',
                              as: 'a',
                              cond: { $eq: ['$$a._id', '$$aid'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                  as: 'a',
                  cond: { $ne: ['$$a', null] },
                },
              },
              [],
            ],
          },
          editor: {
            $cond: [
              {
                $and: [
                  { $gt: [{ $size: '$editorPop' }, 0] },
                  { $gt: [{ $size: '$authorPop' }, 0] },
                  { $eq: [{ $arrayElemAt: ['$editorPop._id', 0] }, { $arrayElemAt: ['$authorPop._id', 0] }] },
                ],
              },
              null,
              { $arrayElemAt: ['$editorPop', 0] },
            ],
          },
        },
      },
      { $project: { categoriesPop: 0, primaryCategoryPop: 0, tagsPop: 0, authorPop: 0, authorsPop: 0, editorPop: 0, 'author.password': 0, 'authors.password': 0, 'editor.password': 0 } },
    );

    const postsWithRelations = await db.collection('posts').aggregate(pipeline).toArray();

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

router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const daysRaw = Number(req.query.days || 7);
    const days = daysRaw === 30 ? 30 : 7;
    const db = getDB(req.tenantId);

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    const prevStart = new Date(now);
    prevStart.setDate(prevStart.getDate() - days * 2);

    const pipelineBase = [
      { $match: { status: 'published' } },
      {
        $addFields: {
          publishedAtEffective: {
            $ifNull: [
              '$publishedAt',
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$publishDate', null] },
                      { $ne: ['$publishDate', ''] },
                    ],
                  },
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          '$publishDate',
                          'T',
                          { $ifNull: ['$publishTime', '00:00'] },
                          ':00.000Z',
                        ],
                      },
                    },
                  },
                  { $ifNull: ['$updatedAt', '$createdAt'] },
                ],
              },
            ],
          },
        },
      },
    ];

    const [result] = await db.collection('posts').aggregate([
      ...pipelineBase,
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                current: {
                  $sum: {
                    $cond: [{ $gte: ['$publishedAtEffective', start] }, 1, 0],
                  },
                },
                previous: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$publishedAtEffective', prevStart] },
                          { $lt: ['$publishedAtEffective', start] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          topAuthor: [
            { $match: { publishedAtEffective: { $gte: start } } },
            { $group: { _id: '$author', count: { $sum: 1 }, authorName: { $first: '$authorName' } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'author' } },
            { $addFields: { author: { $arrayElemAt: ['$author', 0] } } },
            {
              $project: {
                _id: 0,
                count: 1,
                id: '$_id',
                name: { $ifNull: ['$author.name', '$authorName'] },
                slug: '$author.slug',
              },
            },
          ],
          topCategory: [
            { $match: { publishedAtEffective: { $gte: start } } },
            {
              $addFields: {
                categoryIds: {
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ['$categories', []] } }, 0] },
                    '$categories',
                    {
                      $cond: [
                        { $isArray: '$primary_category' },
                        '$primary_category',
                        {
                          $cond: [{ $ne: ['$primary_category', null] }, ['$primary_category'], []],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            { $unwind: '$categoryIds' },
            { $group: { _id: '$categoryIds', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
            { $addFields: { cat: { $arrayElemAt: ['$cat', 0] } } },
            {
              $project: {
                _id: 0,
                count: 1,
                id: '$_id',
                name: { $ifNull: ['$cat.name', { $toString: '$_id' }] },
                slug: '$cat.slug',
              },
            },
          ],
        },
      },
      {
        $project: {
          counts: { $arrayElemAt: ['$counts', 0] },
          topAuthor: { $arrayElemAt: ['$topAuthor', 0] },
          topCategory: { $arrayElemAt: ['$topCategory', 0] },
        },
      },
    ]).toArray();

    const current = Number(result?.counts?.current || 0);
    const previous = Number(result?.counts?.previous || 0);
    const delta = current - previous;
    const deltaPct = previous > 0 ? (delta / previous) * 100 : null;

    res.json({
      days,
      range: { start, end: now },
      published: {
        current,
        previous,
        delta,
        deltaPct,
      },
      topAuthor: result?.topAuthor || null,
      topCategory: result?.topCategory || null,
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
    const { notifySubscribers, notifyType, ...restBody } = (req.body && typeof req.body === 'object') ? req.body : {};
    const hasExplicitAuthor =
      !!req.body.author ||
      !!req.body.primaryAuthor ||
      (Array.isArray(req.body.authors) && req.body.authors.length > 0);
    const payload = {
      ...restBody,
      ...(hasExplicitAuthor ? {} : { author: req.user._id }),
      status,
      publishedAt: status === 'published' ? now : null,
    };
    const post = await Post.create(payload, req.tenantId);
    const db = getDB(req.tenantId);
    const enrichedPost = await populatePost(post, db);
    if (status === 'published' && notifySubscribers !== false) {
      const idOrSlug = String(post.slug || post._id || '');
      await sendTenantPush(req.tenantId, {
        type: notifyType === 'live_update' ? 'live_update' : 'post_published',
        title: post.title || 'New post published',
        body: buildPostSnippet(post),
        image: getNotificationImage(post),
        url: idOrSlug ? `/posts/${encodeURIComponent(idOrSlug)}` : '/',
        postId: String(post._id || ''),
        slug: String(post.slug || ''),
      });
    }
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
    const post = await db.collection('posts').findOne(query);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const populated = await populatePost(post, db);
    res.json(populated || post);
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
    const previous = await db.collection('posts').findOne({ _id: new ObjectId(targetId) });
    const prevStatus = String(previous?.status || '').toLowerCase();
    const prevUpdatesCount = Array.isArray(previous?.liveUpdates) ? previous.liveUpdates.length : 0;

    const { notifySubscribers, notifyType, ...restBody } = (req.body && typeof req.body === 'object') ? req.body : {};
    const desiredStatus = typeof restBody.status === 'string' ? restBody.status.toLowerCase().trim() : prevStatus;
    const isStatusPublishTransition = prevStatus !== 'published' && desiredStatus === 'published';
    const isExplicitPublishAction = desiredStatus === 'published' && restBody.publishedAt != null;

    const updateBody = { ...restBody };
    if (isStatusPublishTransition && !updateBody.publishedAt) updateBody.publishedAt = new Date();
    const shouldBumpPublishedAt =
      desiredStatus === 'published' &&
      ((notifySubscribers === true && (notifyType === 'post_published' || notifyType === 'live_update')) || isExplicitPublishAction);
    if (shouldBumpPublishedAt) {
      const now = new Date();
      const ist = getIstDateParts(now);
      updateBody.publishedAt = now;
      if (ist.publishDate) updateBody.publishDate = ist.publishDate;
      if (ist.publishTime) updateBody.publishTime = ist.publishTime;
    }

    const post = await Post.update(targetId, updateBody, req.tenantId);
    const enrichedPost = await populatePost(post, db);
    const next = enrichedPost || post;

    const nextStatus = String(next?.status || '').toLowerCase();
    const nextUpdatesCount = Array.isArray(next?.liveUpdates) ? next.liveUpdates.length : 0;
    const isLiveUpdatePublish =
      (notifySubscribers === true || isExplicitPublishAction) &&
      notifyType === 'live_update' &&
      nextStatus === 'published' &&
      String(next?.type || '').toLowerCase().includes('live') &&
      nextUpdatesCount > prevUpdatesCount;
    const shouldNotifyLiveUpdateAny =
      (notifySubscribers === true || isExplicitPublishAction) &&
      notifyType === 'live_update' &&
      nextStatus === 'published' &&
      String(next?.type || '').toLowerCase().includes('live');

    const shouldNotifyPublish = isStatusPublishTransition && notifySubscribers !== false;
    const shouldNotifyExplicitPublish =
      (notifySubscribers === true || isExplicitPublishAction) &&
      (notifyType === 'post_published' || !notifyType) &&
      desiredStatus === 'published';

    if (shouldNotifyLiveUpdateAny || shouldNotifyPublish || shouldNotifyExplicitPublish) {
      const idOrSlug = String(next.slug || next._id || '');
      const lastUpdate = Array.isArray(next.liveUpdates) && next.liveUpdates.length > 0 ? next.liveUpdates[next.liveUpdates.length - 1] : null;
      await sendTenantPush(req.tenantId, {
        type: shouldNotifyLiveUpdateAny ? 'live_update' : 'post_published',
        title: next.title || 'New post published',
        body: shouldNotifyLiveUpdateAny
          ? (String(lastUpdate?.title || lastUpdate?.heading || 'New live update').trim())
          : buildPostSnippet(next),
        image: getNotificationImage(next),
        url: idOrSlug ? `/posts/${encodeURIComponent(idOrSlug)}` : '/',
        postId: String(next._id || ''),
        slug: String(next.slug || ''),
      });
    }
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
    const previous = await db.collection('posts').findOne({ _id: new ObjectId(targetId) });
    const prevStatus = String(previous?.status || '').toLowerCase();
    const nextStatus = typeof status === 'string' ? status.toLowerCase().trim() : prevStatus;
    const isStatusPublishTransition = prevStatus !== 'published' && nextStatus === 'published';

    const updateData = { status: nextStatus, updatedAt: new Date(), publishedAt: nextStatus === 'published' ? new Date() : null };
    const updated = await Post.update(targetId, updateData, req.tenantId);
    if (isStatusPublishTransition) {
      const idOrSlug = String(updated.slug || updated._id || '');
      await sendTenantPush(req.tenantId, {
        type: 'post_published',
        title: updated.title || 'New post published',
        body: buildPostSnippet(updated),
        image: getNotificationImage(updated),
        url: idOrSlug ? `/posts/${encodeURIComponent(idOrSlug)}` : '/',
        postId: String(updated._id || ''),
        slug: String(updated.slug || ''),
      });
    }
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
