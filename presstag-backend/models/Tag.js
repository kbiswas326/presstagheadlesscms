const { ObjectId } = require('mongodb');

class Tag {
  static async create(tagData) {
    const { getDB } = require('../config/db');
    const db = getDB();
    
    if (!tagData.name) {
      throw new Error("Name is required");
    }

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
    
    // Check for duplicate slug
    const existing = await db.collection('tags').findOne({ slug: tag.slug });
    if (existing) {
      throw new Error("Tag with this slug already exists");
    }

    const result = await db.collection('tags').insertOne(tag);
    return { _id: result.insertedId, ...tag };
  }

  static async findAll() {
    const { getDB } = require('../config/db');
    const db = getDB();
    
    const pipeline = [
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'tags',
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

    const result = await db.collection('tags').aggregate(pipeline).toArray();
    return result;
  }

  static async findById(id) {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('tags').findOne({ _id: new ObjectId(id) });
  }

  static async findBySlug(slug) {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('tags').findOne({ slug });
  }

  static async update(id, updateData) {
    const { getDB } = require('../config/db');
    const db = getDB();
    updateData.updatedAt = new Date();
    
    // If name is updated but slug isn't, maybe we should update slug? 
    // Usually we don't auto-update slug on edit to preserve URLs.
    
    const result = await db.collection('tags').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result;
  }

  static async delete(id) {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('tags').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Tag;
