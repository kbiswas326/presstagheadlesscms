const { ObjectId } = require('mongodb');

class Category {
  static async create(categoryData) {
    const { getDB } = require('../config/db');
    const db = getDB();
    
    if (!categoryData.name) {
      throw new Error("Name is required");
    }

    const category = {
      name: categoryData.name,
      description: categoryData.description || '',
      image: categoryData.image || null, // Added feature image field
      slug: categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      metaTitle: categoryData.metaTitle || '',
      metaDescription: categoryData.metaDescription || '',
      parent: categoryData.parent || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Check for duplicate slug
    const existing = await db.collection('categories').findOne({ slug: category.slug });
    if (existing) {
      throw new Error("Category with this slug already exists");
    }

    const result = await db.collection('categories').insertOne(category);
    return { _id: result.insertedId, ...category };
  }

  static async findAll() {
    const { getDB } = require('../config/db');
    const db = getDB();
    
    const pipeline = [
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'categories',
          as: 'matchedPosts'
        }
      },
      {
        $addFields: {
          postCount: { $size: '$matchedPosts' }
        }
      },
      {
        $project: {
          matchedPosts: 0
        }
      }
    ];

    return await db.collection('categories').aggregate(pipeline).toArray();
  }

  static async findById(id) {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('categories').findOne({ _id: new ObjectId(id) });
  }

  static async findBySlug(slug) {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('categories').findOne({ slug });
  }

  static async update(id, updateData) {
    const { getDB } = require('../config/db');
    const db = getDB();
    updateData.updatedAt = new Date();
    const result = await db.collection('categories').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result;
  }

  static async delete(id) {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Category;
