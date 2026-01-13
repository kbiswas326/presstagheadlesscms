///models/User.js///
const { ObjectId } = require('mongodb');
const bcryptjs = require('bcryptjs');

class User {
  static async register(userData) {
    const { getDB } = require('../config/db');
    const db = getDB();
    
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

  static async login(email, password) {
    const { getDB } = require('../config/db');
    const db = getDB();
    
    const user = await db.collection('users').findOne({ email });
    if (!user) throw new Error('User not found');
    
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Invalid password');
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async findById(id) {
    const { getDB } = require('../config/db');
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  static async findAll() {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('users').find({}).project({ password: 0 }).toArray();
  }

  static async update(id, updateData) {
    const { getDB } = require('../config/db');
    const db = getDB();

    if (updateData.password) {
      updateData.password = await bcryptjs.hash(updateData.password, 10);
    }

    updateData.updatedAt = new Date();
    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;

    const { password, ...userWithoutPassword } = result;
    return userWithoutPassword;
  }

  static async delete(id) {
    const { getDB } = require('../config/db');
    const db = getDB();
    return await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = User;