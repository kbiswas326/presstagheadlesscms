// models/Media.js
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

class Media {
  static async create(data) {
    const db = getDB();
    const media = {
      ...data,
      createdAt: new Date(),
    };
    const result = await db.collection('media').insertOne(media);
    return { _id: result.insertedId, ...media };
  }

  static async findAll() {
    const db = getDB();
    return await db
      .collection('media')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  }
}

module.exports = Media;

