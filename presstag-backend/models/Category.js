///backend/models/Category.js | Mongoose model for managing categories, including fields for name, description, image, slug, meta title, meta description, and parent category.///
const { ObjectId } = require('mongodb');

class Category {
  static async create(categoryData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    
    if (!categoryData.name) throw new Error("Name is required");

    const category = {
      name: categoryData.name,
      description: categoryData.description || '',
      image: categoryData.image || null,
      slug: categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      metaTitle: categoryData.metaTitle || '',
      metaDescription: categoryData.metaDescription || '',
      parent: categoryData.parent || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const existing = await db.collection('categories').findOne({ slug: category.slug });
    if (existing) throw new Error("Category with this slug already exists");

    const result = await db.collection('categories').insertOne(category);
    return { _id: result.insertedId, ...category };
  }

  static async findAll(tenantId = null, options = {}) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);

    const withCounts = options?.withCounts !== false;

    if (!withCounts) {
      return await db.collection('categories').find({}).sort({ name: 1, slug: 1 }).toArray();
    }
    
    const pipeline = [
      { $lookup: { from: 'posts', localField: '_id', foreignField: 'categories', as: 'matchedPosts' } },
      { $addFields: { postCount: { $size: '$matchedPosts' } } },
      { $project: { matchedPosts: 0 } }
    ];

    return await db.collection('categories').aggregate(pipeline).toArray();
  }

  static async findById(id, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    return await db.collection('categories').findOne({ _id: new ObjectId(id) });
  }

  static async findBySlug(slug, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    return await db.collection('categories').findOne({ slug });
  }

  static async update(id, updateData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    updateData.updatedAt = new Date();
    return await db.collection('categories').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
  }

  static async delete(id, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    return await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Category;
