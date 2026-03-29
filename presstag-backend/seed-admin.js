///  Run this ONCE to create your admin user.
///  Command: node seed-admin.js
///  Then DELETE this file or add it to .gitignore

require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcryptjs = require('bcryptjs');

// ✏️ CHANGE THESE to your desired admin credentials
const ADMIN_NAME = 'Koushik Biswas';
const ADMIN_EMAIL = 'koushik@getpresstag.com';
const ADMIN_PASSWORD = '#q_!jdhVt.@kltxbK8b123!!';
const ADMIN_ROLE = 'admin';

async function seedAdmin() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables.');
    console.error('   Make sure your .env file exists with MONGODB_URI set.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    // Get the database name from the URI or fall back to 'presstag'
    const dbName = uri.split('/').pop().split('?')[0] || 'presstag';
    const db = client.db(dbName);
    const users = db.collection('users');

    // Check if admin already exists
    const existing = await users.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`⚠️  User with email "${ADMIN_EMAIL}" already exists.`);
      console.log('   Delete the existing user from Atlas first, or use a different email.');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, 10);

    // Insert admin user
    const result = await users.insertOne({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: ADMIN_ROLE,
      slug: 'admin',
      bio: '',
      image: null,
      seoTitle: '',
      seoDescription: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('');
    console.log('🎉 Admin user created successfully!');
    console.log('─────────────────────────────────');
    console.log(`   Name:     ${ADMIN_NAME}`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role:     ${ADMIN_ROLE}`);
    console.log(`   ID:       ${result.insertedId}`);
    console.log('─────────────────────────────────');
    console.log('');
    console.log('✅ You can now log in to PressTag Admin.');
    console.log('⚠️  Delete seed-admin.js after use!');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await client.close();
  }
}

seedAdmin();