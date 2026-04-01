///backend/models/Post.js ///
const { ObjectId } = require('mongodb');

class Post {
  /* ============================
     CREATE POST
  ============================ */
  static async create(postData) {
    const { getDB } = require('../config/db');
    const db = getDB();

    // ---------- Author handling ----------
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

    /* Publishing */
    let publishedAt = postData.publishedAt ? new Date(postData.publishedAt) : null;

    // Prevent 'new' collision
    if (postData.slug === 'new') {
        postData.slug = `untitled-${Date.now()}`;
    }
    if (postData.title === 'new') {
        postData.title = 'Untitled Post';
    }

    if (postData.status === 'published') {
       // Prioritize explicit date/time if provided
       if (postData.publishDate && postData.publishTime) {
           // Assume IST (+05:30) to match frontend logic
           const dateTimeString = `${postData.publishDate}T${postData.publishTime}:00+05:30`;
           publishedAt = new Date(dateTimeString);
       } else if (!publishedAt) {
           publishedAt = new Date();
       }
    }

    const post = {
      /* Core */
      type: postData.type || 'article',
      title: postData.title,
      slug: postData.slug,
      summary: postData.summary || '',
      excerpt: postData.excerpt || '',
      content: postData.content || '',

      /* Media */
      featuredImage: postData.featuredImage || null,
      videoUrl: postData.videoUrl || null,
      videoDuration: postData.videoDuration || null,
      images: postData.images || [],
      stories: postData.stories || [],

      /* Author */
      author: authorId,
      authorName,

      /* Taxonomy */
      categories: (postData.categories || [])
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id)),

      tags: (postData.tags || [])
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id)),

      /* SEO */
      seo: postData.seo || {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        schema: {},
        focusKeyword: '',
      },

      /* Publishing */
      status: postData.status || 'draft',
      publishedAt: publishedAt,
      publishDate: postData.publishDate || null,
      publishTime: postData.publishTime || null,

      /* Live */
      isLive: postData.isLive || false,
      liveUpdates: postData.liveUpdates || [],

      /* Metrics */
      seoScore: postData.seoScore || 0,
      views: 0,

      /* URL */
      originalUrl: postData.originalUrl || null,
      
      /* AI */
      ai_pointers: postData.ai_pointers || [],

      /* Timestamps */
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
  static async update(id, updateData) {
    if (!ObjectId.isValid(id)) {
      return { error: 'Invalid post ID' };
    }

    const { getDB } = require('../config/db');
    const db = getDB();

    updateData.updatedAt = new Date();

    // Logic to sync publishedAt with publishDate and publishTime
    if (updateData.status === 'published' || (updateData.publishDate && updateData.publishTime)) {
        // If we have explicit publishedAt from frontend, use it (highest priority)
        if (updateData.publishedAt) {
            updateData.publishedAt = new Date(updateData.publishedAt);
            console.log('✅ Using publishedAt from frontend:', updateData.publishedAt);
        }
        // Otherwise, if we have explicit date and time, construct publishedAt from them
        else if (updateData.publishDate && updateData.publishTime) {
            // Assume IST (+05:30)
            const dateTimeString = `${updateData.publishDate}T${updateData.publishTime}:00+05:30`;
            updateData.publishedAt = new Date(dateTimeString);
            console.log('✅ Constructed publishedAt from date/time:', updateData.publishedAt);
        }
        // If becoming published but no specific date provided, default to NOW
        else if (updateData.status === 'published' && !updateData.publishedAt) {
             updateData.publishedAt = new Date();
             console.log('✅ Set publishedAt to NOW:', updateData.publishedAt);
        }
    }
    // If publishedAt is set but status isn't 'published', still respect it
    else if (updateData.publishedAt) {
      updateData.publishedAt = new Date(updateData.publishedAt);
      console.log('✅ Set publishedAt:', updateData.publishedAt);
    }

    // ---------- Author update ----------
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

    // ---------- Categories ----------
    if (updateData.categories) {
      updateData.categories = updateData.categories
        .map(c => (typeof c === 'string' ? c : c?._id))
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
    }

    // ---------- Tags ----------
    if (updateData.tags) {
      updateData.tags = updateData.tags
        .map(t => (typeof t === 'string' ? t : t?._id))
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));
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
     FIND BY ID (SAFE)
  ============================ */
  static async findById(id) {
    if (!ObjectId.isValid(id)) return null;

    const { getDB } = require('../config/db');
    return getDB()
      .collection('posts')
      .findOne({ _id: new ObjectId(id) });
  }

  /* ============================
     DELETE POST (SAFE)
  ============================ */
  static async delete(id) {
    if (!ObjectId.isValid(id)) {
      return { error: 'Invalid post ID' };
    }

    const { getDB } = require('../config/db');
    return getDB()
      .collection('posts')
      .deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Post;
