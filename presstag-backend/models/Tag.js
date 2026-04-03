///backend/models/Tag.js | Mongoose model for managing tags, including fields for name, description, image, slug, meta title, and meta description.///
const { ObjectId } = require('mongodb');

class Tag {
  static async create(tagData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    
    if (!tagData.name) throw new Error("Name is required");

    const tag = {
      name: tagData.name,
      slug: tagData.slug || tagData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      description: tagData.description || '',
      image: tagData.image || null,
      metaTitle: tagData.metaTitle || '',
      metaDescription: tagData.metaDescription || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const existing = await db.collection('tags').findOne({ slug: tag.slug });
    if (existing) throw new Error("Tag with this slug already exists");

    const result = await db.collection('tags').insertOne(tag);
    return { _id: result.insertedId, ...tag };
  }

  static async findAll(tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    
    const pipeline = [
      { $lookup: { from: 'posts', localField: '_id', foreignField: 'tags', as: 'matchedPosts' } },
      { $addFields: { postCount: { $size: '$matchedPosts' } } },
      { $project: { matchedPosts: 0 } }
    ];

    return await db.collection('tags').aggregate(pipeline).toArray();
  }

  static async findById(id, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    return await db.collection('tags').findOne({ _id: new ObjectId(id) });
  }

  static async findBySlug(slug, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    return await db.collection('tags').findOne({ slug });
  }

  static async update(id, updateData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    updateData.updatedAt = new Date();
    return await db.collection('tags').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
  }

  static async delete(id, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    return await db.collection('tags').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Tag;