// checkImages.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkImages() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('📸 Checking Media Collection:');
    const media = await db.collection('media').find({}).limit(5).toArray();
    media.forEach(m => {
      console.log(`  - ${m.filename}: ${m.url}`);
    });
    
    console.log('\n📝 Checking Posts Collection:');
    const posts = await db.collection('posts').find({ featuredImage: { $exists: true } }).limit(5).toArray();
    posts.forEach(p => {
      console.log(`  - ${p.title}: ${p.featuredImage}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkImages();