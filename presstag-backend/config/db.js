// config/db.js | Multi-tenant MongoDB connection setup
const { MongoClient } = require('mongodb');
require('dotenv').config();

let client;
const dbCache = {}; // Cache database connections per tenant

const connectDB = async () => {
  try {
    client = new MongoClient(process.env.MONGO_URI, {
      tls: true,
      family: 4,
      tlsAllowInvalidCertificates: true,
    });
    await client.connect();
    
    // Default DB is presstag (platform DB)
    dbCache['presstag'] = client.db('presstag');
    
    console.log('✅ MongoDB connected');
    return dbCache['presstag'];
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️ Server entering FAILSAFE MODE.');
  }
};

// Get DB for a specific tenant — defaults to presstag
const getDB = (tenantId = null) => {
  if (!client) return null;
  
  if (!tenantId) return dbCache['presstag'];
  
  // Return cached connection or create new one
  if (!dbCache[tenantId]) {
    dbCache[tenantId] = client.db(tenantId);
    console.log(`🔌 Connected to tenant DB: ${tenantId}`);
  }
  
  return dbCache[tenantId];
};

module.exports = { connectDB, getDB };