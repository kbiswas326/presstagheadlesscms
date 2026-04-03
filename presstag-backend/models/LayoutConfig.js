// models/LayoutConfig.js | Manages layout configuration data for the CMS, including retrieval, creation, and updates.//
const { getDB } = require('../config/db');

class LayoutConfig {
  static collectionName = 'layout_config';

  static async get(tenantId = null) {
    const db = getDB(tenantId);
    if (!db) throw new Error('Database not initialized');
    return await db.collection(this.collectionName).findOne({});
  }

  static async create(configData, tenantId = null) {
    const db = getDB(tenantId);
    if (!db) throw new Error('Database not initialized');
    
    const config = { ...configData, updatedAt: new Date() };
    await db.collection(this.collectionName).insertOne(config);
    return config;
  }

  static async update(configData, tenantId = null) {
    const db = getDB(tenantId);
    if (!db) throw new Error('Database not initialized');

    const updateData = { ...configData, updatedAt: new Date() };
    delete updateData._id;

    const result = await db.collection(this.collectionName).findOneAndUpdate(
      {},
      { $set: updateData },
      { returnDocument: 'after', upsert: true }
    );
    
    return result;
  }
}

module.exports = LayoutConfig;

module.exports = LayoutConfig;
