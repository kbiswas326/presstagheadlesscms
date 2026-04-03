///backend/models/Post.js ///
const { ObjectId } = require('mongodb');

class Post {
  /* ============================
     CREATE POST
  ============================ */
  static async create(postData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);

    let authorName = 'Unknown';
    let authorId = null;

    if (postData.author) {
      if (!ObjectId.isValid(postData.author)) {
        return { error: 'Invalid author ID format' };
      }

      const author = await db
        .collection('users')
        .findOne({ _id: new ObjectId(postData.author) });

      if (!author) {
        return { error: 'Author not found' };
      }

      authorId = new ObjectId(postData.author);
      authorName = author.name;
    }

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
      author: authorId,
      authorName,
      categories: (postData.categories || [])
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id)),
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

    if (updateData.author) {
      if (!ObjectId.isValid(updateData.author)) {
        return { error: 'Invalid author ID format' };
      }

      const author = await db
        .collection('users')
        .findOne({ _id: new ObjectId(updateData.author) });

      if (!author) {
        return { error: 'Author not found' };
      }

      updateData.author = new ObjectId(updateData.author);
      updateData.authorName = author.name;
    }

    if (updateData.categories) {
      updateData.categories = updateData.categories
        .map(c => (typeof c === 'string' ? c : c?._id))
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
    }

    if (updateData.tags) {
      updateData.tags = updateData.tags
        .map(t => (typeof t === 'string' ? t : t?._id))
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
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