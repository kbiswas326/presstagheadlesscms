// models/Media.js | Mongoose model for managing media items, including fields for URL, type, alt text, caption, and metadata.///
const { ObjectId } = require('mongodb');

class Media {
  static async create(data, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    const media = {
      ...data,
      createdAt: new Date(),
    };
    const result = await db.collection('media').insertOne(media);
    return { _id: result.insertedId, ...media };
  }

  static async findAll(tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    return await db.collection('media').find({}).sort({ createdAt: -1 }).toArray();
  }

  static async findById(id, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    if (!ObjectId.isValid(id)) throw new Error("Invalid ID");
    return await db.collection('media').findOne({ _id: new ObjectId(id) });
  }

  static async delete(id, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    if (!ObjectId.isValid(id)) throw new Error("Invalid ID");
    return await db.collection('media').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Media;

