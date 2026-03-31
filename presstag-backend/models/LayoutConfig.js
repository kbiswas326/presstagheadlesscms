// models/LayoutConfig.js | Manages layout configuration data for the CMS, including retrieval, creation, and updates.//
const { getDB } = require('../config/db');

class LayoutConfig {
  static collectionName = 'layout_config';

  static async get() {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    return await db.collection(this.collectionName).findOne({});
  }

  static async create(configData) {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    
    const config = {
      ...configData,
      updatedAt: new Date()
    };
    
    await db.collection(this.collectionName).insertOne(config);
    return config;
  }

  static async update(configData) {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');

    const updateData = {
      ...configData,
      updatedAt: new Date()
    };
    
    // Remove _id from updateData if it exists to avoid immutable field error
    delete updateData._id;

    // Use findOneAndUpdate with upsert
    const result = await db.collection(this.collectionName).findOneAndUpdate(
      {}, 
      { $set: updateData },
      { returnDocument: 'after', upsert: true }
    );
    
    return result;
  }
}

module.exports = LayoutConfig;
