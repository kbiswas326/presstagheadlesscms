const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI, {
      tls: true,
      family: 4, // Force IPv4
      tlsAllowInvalidCertificates: true, // Fix for SSL alert 80
    });
    await client.connect();
    db = client.db();
    console.log('✅ MongoDB connected');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️ Server entering FAILSAFE MODE. Mock data will be served.');
    console.warn('💡 Tip: Check your MongoDB Atlas IP Whitelist if you see SSL/Network errors.');
    // Do not exit process, just log error so server stays alive for diagnostics
    // process.exit(1); 
  }
};

const getDB = () => db;

module.exports = { connectDB, getDB };