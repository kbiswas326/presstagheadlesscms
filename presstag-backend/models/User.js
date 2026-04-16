///backend > models/User.js | User model for handling user registration, authentication, and management in the MongoDB database. This includes password hashing and validation using bcryptjs.///
const { ObjectId } = require('mongodb');
const bcryptjs = require('bcryptjs');

class User {
  static async register(userData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    
    const existingUser = await db.collection('users').findOne({ email: userData.email });
    if (existingUser) throw new Error('Email already registered');
    
    const hashedPassword = await bcryptjs.hash(userData.password, 10);
    const user = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'editor',
      slug: userData.slug || '',
      bio: userData.bio || '',
      image: userData.image || null,
      seoTitle: userData.seoTitle || '',
      seoDescription: userData.seoDescription || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('users').insertOne(user);
    const { password, ...userWithoutPassword } = user;
    return { _id: result.insertedId, ...userWithoutPassword };
  }

  static async login(email, password, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    
    const user = await db.collection('users').findOne({ email });
    if (!user) throw new Error('User not found');
    
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Invalid password');
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async findById(id, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    const idStr = String(id || '').trim();
    const query = ObjectId.isValid(idStr)
      ? { $or: [{ _id: new ObjectId(idStr) }, { _id: idStr }] }
      : { _id: idStr };
    const user = await db.collection('users').findOne(query);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  static async findAll(tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    return await db.collection('users').find({}).project({ password: 0 }).toArray();
  }

  static async update(id, updateData, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    const idStr = String(id || '').trim();

    if (updateData.password) {
      updateData.password = await bcryptjs.hash(updateData.password, 10);
    }

    updateData.updatedAt = new Date();
    const result = await db.collection('users').findOneAndUpdate(
      ObjectId.isValid(idStr) ? { $or: [{ _id: new ObjectId(idStr) }, { _id: idStr }] } : { _id: idStr },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;

    const { password, ...userWithoutPassword } = result;
    return userWithoutPassword;
  }

  static async delete(id, tenantId = null) {
    const { getDB } = require('../config/db');
    const db = getDB(tenantId);
    const idStr = String(id || '').trim();
    const query = ObjectId.isValid(idStr)
      ? { $or: [{ _id: new ObjectId(idStr) }, { _id: idStr }] }
      : { _id: idStr };
    return await db.collection('users').deleteOne(query);
  }
}

module.exports = User;
