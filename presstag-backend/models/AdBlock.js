const { ObjectId } = require('mongodb');

class AdBlock {
  static async create(data) {
    const { getDB } = require('../config/db');
    const db = getDB();

    if (!data.name || !data.code || !data.position) {
      throw new Error("Name, Code, and Position are required");
    }

    const adBlock = {
      name: data.name,
      code: data.code,
      position: data.position,
      isActive: data.isActive !== undefined ? data.isActive : true,
      priority: data.priority ? parseInt(data.priority) : 10,
      displayConditions: data.displayConditions || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('ad_blocks').insertOne(adBlock);
    return { _id: result.insertedId, ...adBlock };
  }

  static async findAll() {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('ad_blocks').find().sort({ priority: 1 }).toArray();
  }

  static async findById(id) {
    const { getDB } = require('../config/db');
    const db = getDB();
    if (!ObjectId.isValid(id)) throw new Error("Invalid ID");
    return await db.collection('ad_blocks').findOne({ _id: new ObjectId(id) });
  }

  static async update(id, data) {
    const { getDB } = require('../config/db');
    const db = getDB();
    if (!ObjectId.isValid(id)) throw new Error("Invalid ID");

    const updateFields = {
      updatedAt: new Date()
    };
    if (data.name) updateFields.name = data.name;
    if (data.code) updateFields.code = data.code;
    if (data.position) updateFields.position = data.position;
    if (data.isActive !== undefined) updateFields.isActive = data.isActive;
    if (data.priority !== undefined) updateFields.priority = parseInt(data.priority);
    if (data.displayConditions) updateFields.displayConditions = data.displayConditions;

    const result = await db.collection('ad_blocks').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    return result;
  }

  static async delete(id) {
    const { getDB } = require('../config/db');
    const db = getDB();
    if (!ObjectId.isValid(id)) throw new Error("Invalid ID");
    const result = await db.collection('ad_blocks').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

module.exports = AdBlock;
