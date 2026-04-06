///backend/models/Post.js ///
const { ObjectId } = require('mongodb');

class Post {
  /* ============================
     CREATE POST
  ============================ */
  static async create(postData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);

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

    const normalizeIdArray = (arr) => {
      const list = Array.isArray(arr) ? arr : (arr ? [arr] : []);
      return list
        .map((v) => toObjectId(v))
        .filter(Boolean);
    };

    const rawPrimaryCategory = Array.isArray(postData.primary_category)
      ? postData.primary_category[0]
      : (postData.primary_category || postData.primaryCategory);
    const primaryCategoryId = toObjectId(rawPrimaryCategory);

    const rawCategories = Array.isArray(postData.categories) ? postData.categories : [];
    const categoryIds = normalizeIdArray(rawCategories);
    const dedupedCategoryIds = Array.from(new Map(categoryIds.map((oid) => [String(oid), oid])).values());

    if (dedupedCategoryIds.length > 3) {
      return { error: 'You can select up to 3 categories.' };
    }

    const normalizedCategories = primaryCategoryId
      ? [
          primaryCategoryId,
          ...dedupedCategoryIds.filter((oid) => String(oid) !== String(primaryCategoryId)),
        ]
      : dedupedCategoryIds;

    const rawAuthors = Array.isArray(postData.authors) ? postData.authors : (postData.authors ? [postData.authors] : []);
    const authorIds = normalizeIdArray(rawAuthors);
    const dedupedAuthorIds = Array.from(new Map(authorIds.map((oid) => [String(oid), oid])).values());

    const primaryAuthorId = toObjectId(postData.author || postData.primaryAuthor) || dedupedAuthorIds[0] || null;
    const authors = primaryAuthorId
      ? [
          primaryAuthorId,
          ...dedupedAuthorIds.filter((oid) => String(oid) !== String(primaryAuthorId)),
        ]
      : dedupedAuthorIds;

    let authorName = 'Unknown';
    if (primaryAuthorId) {
      const author = await db.collection('users').findOne({ _id: primaryAuthorId });
      if (!author) return { error: 'Author not found' };
      authorName = author.name;
    }

    const rawEditor = postData.editor || postData.editorId;
    const editorId = toObjectId(rawEditor);
    let editorName = null;
    if (editorId) {
      const editorUser = await db.collection('users').findOne({ _id: editorId });
      if (!editorUser) return { error: 'Editor not found' };
      editorName = editorUser.name;
    }

    const normalizedEditorId = (editorId && primaryAuthorId && String(editorId) === String(primaryAuthorId))
      ? null
      : editorId;
    const normalizedEditorName = normalizedEditorId ? editorName : null;

    let publishedAt = postData.publishedAt ? new Date(postData.publishedAt) : null;

    if (postData.slug === 'new') postData.slug = `untitled-${Date.now()}`;
    if (postData.title === 'new') postData.title = 'Untitled Post';

    if (postData.status === 'published') {
      if (postData.publishDate && postData.publishTime) {
        const dateTimeString = `${postData.publishDate}T${postData.publishTime}:00+05:30`;
        publishedAt = new Date(dateTimeString);
      } else if (!publishedAt) {
        publishedAt = new Date();
      }
    }

    const post = {
      type: postData.type || 'article',
      title: postData.title,
      slug: postData.slug,
      summary: postData.summary || '',
      excerpt: postData.excerpt || '',
      content: postData.content || '',
      featuredImage: postData.featuredImage || null,
      videoUrl: postData.videoUrl || null,
      videoDuration: postData.videoDuration || null,
      images: postData.images || [],
      stories: postData.stories || [],
      author: primaryAuthorId,
      authorName,
      authors,
      editor: normalizedEditorId,
      editorName: normalizedEditorName,
      categories: normalizedCategories,
      primary_category: primaryCategoryId ? [primaryCategoryId] : [],
      tags: (postData.tags || [])
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id)),
      seo: postData.seo || {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        schema: {},
        focusKeyword: '',
      },
      status: postData.status || 'draft',
      publishedAt: publishedAt,
      publishDate: postData.publishDate || null,
      publishTime: postData.publishTime || null,
      isLive: postData.isLive || false,
      liveUpdates: postData.liveUpdates || [],
      seoScore: postData.seoScore || 0,
      views: 0,
      originalUrl: postData.originalUrl || null,
      previousSlugs: postData.previousSlugs || [],
      ai_pointers: postData.ai_pointers || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const result = await db.collection('posts').insertOne(post);
      return { _id: result.insertedId, ...post };
    } catch (err) {
      return { error: err.message };
    }
  }

  /* ============================
     UPDATE POST
  ============================ */
  static async update(id, updateData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);

    if (!ObjectId.isValid(id)) {
      return { error: 'Invalid post ID' };
    }

    updateData.updatedAt = new Date();

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

    const normalizeIdArray = (arr) => {
      const list = Array.isArray(arr) ? arr : (arr ? [arr] : []);
      return list
        .map((v) => toObjectId(v))
        .filter(Boolean);
    };

    if (updateData.status === 'published' || (updateData.publishDate && updateData.publishTime)) {
      if (updateData.publishedAt) {
        updateData.publishedAt = new Date(updateData.publishedAt);
        console.log('✅ Using publishedAt from frontend:', updateData.publishedAt);
      } else if (updateData.publishDate && updateData.publishTime) {
        const dateTimeString = `${updateData.publishDate}T${updateData.publishTime}:00+05:30`;
        updateData.publishedAt = new Date(dateTimeString);
        console.log('✅ Constructed publishedAt from date/time:', updateData.publishedAt);
      } else if (updateData.status === 'published' && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
        console.log('✅ Set publishedAt to NOW:', updateData.publishedAt);
      }
    } else if (updateData.publishedAt) {
      updateData.publishedAt = new Date(updateData.publishedAt);
      console.log('✅ Set publishedAt:', updateData.publishedAt);
    }

    if (updateData.authors !== undefined || updateData.author !== undefined || updateData.primaryAuthor !== undefined) {
      const incomingAuthors = updateData.authors !== undefined ? updateData.authors : [];
      const normalizedIncomingAuthors = normalizeIdArray(incomingAuthors);
      const dedupedAuthorIds = Array.from(new Map(normalizedIncomingAuthors.map((oid) => [String(oid), oid])).values());

      const primaryAuthorId = toObjectId(updateData.author || updateData.primaryAuthor) || dedupedAuthorIds[0] || null;
      const authors = primaryAuthorId
        ? [
            primaryAuthorId,
            ...dedupedAuthorIds.filter((oid) => String(oid) !== String(primaryAuthorId)),
          ]
        : dedupedAuthorIds;

      if (primaryAuthorId) {
        const author = await db.collection('users').findOne({ _id: primaryAuthorId });
        if (!author) return { error: 'Author not found' };
        updateData.author = primaryAuthorId;
        updateData.authorName = author.name;
      } else {
        updateData.author = null;
        updateData.authorName = 'Unknown';
      }

      updateData.authors = authors;
      delete updateData.primaryAuthor;
    }

    if (updateData.editor !== undefined || updateData.editorId !== undefined) {
      const editorId = toObjectId(updateData.editor || updateData.editorId);
      if (editorId) {
        const editorUser = await db.collection('users').findOne({ _id: editorId });
        if (!editorUser) return { error: 'Editor not found' };
        updateData.editor = editorId;
        updateData.editorName = editorUser.name;
      } else {
        updateData.editor = null;
        updateData.editorName = null;
      }
      delete updateData.editorId;
    }

    if (updateData.categories) {
      const normalized = normalizeIdArray(updateData.categories);
      const deduped = Array.from(new Map(normalized.map((oid) => [String(oid), oid])).values());
      if (deduped.length > 3) {
        return { error: 'You can select up to 3 categories.' };
      }

      const rawPrimaryCategory = Array.isArray(updateData.primary_category)
        ? updateData.primary_category[0]
        : (updateData.primary_category || updateData.primaryCategory);
      const primaryCategoryId = toObjectId(rawPrimaryCategory);

      updateData.categories = primaryCategoryId
        ? [
            primaryCategoryId,
            ...deduped.filter((oid) => String(oid) !== String(primaryCategoryId)),
          ]
        : deduped;

      if (primaryCategoryId) updateData.primary_category = [primaryCategoryId];
      else if (updateData.primary_category !== undefined) updateData.primary_category = [];
      delete updateData.primaryCategory;
    }

    if (updateData.tags) {
      updateData.tags = updateData.tags
        .map(t => (typeof t === 'string' ? t : t?._id))
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
    }

    if (updateData.editor && updateData.author && String(updateData.editor) === String(updateData.author)) {
      updateData.editor = null;
      updateData.editorName = null;
    }

    if (updateData.slug) {
      const existingPost = await db.collection('posts').findOne({ _id: new ObjectId(id) });
      if (existingPost && existingPost.slug && existingPost.slug !== updateData.slug) {
        const previousSlugs = existingPost.previousSlugs || [];
        if (!previousSlugs.includes(existingPost.slug)) {
          previousSlugs.push(existingPost.slug);
        }
        updateData.previousSlugs = previousSlugs;
      }
    }

    try {
      const result = await db.collection('posts').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return { error: 'Post not found' };
      }

      return result;
    } catch (err) {
      return { error: err.message };
    }
  }

  /* ============================
     FIND BY ID
  ============================ */
  static async findById(id, tenantId = null) {
    if (!ObjectId.isValid(id)) return null;
    const { getDB } = require('../config/db');
    return getDB(tenantId).collection('posts').findOne({ _id: new ObjectId(id) });
  }

  /* ============================
     DELETE POST
  ============================ */
  static async delete(id, tenantId = null) {
    if (!ObjectId.isValid(id)) {
      return { error: 'Invalid post ID' };
    }
    const { getDB } = require('../config/db');
    return getDB(tenantId).collection('posts').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Post;
