// migration/fixImageUrls2.js
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { connectDB, getDB } = require('../config/db');

const clientId = 'default';

async function migrateImageUrls() {
  try {
    await connectDB();
    const db = getDB();
    
    console.log('🚀 Connected to MongoDB');
    
    console.log('\n📸 Migrating Media collection...');
    const mediaItems = await db.collection('media').find({ url: { $exists: true } }).toArray();
    
    console.log(`📊 Found ${mediaItems.length} media items`);
    
    let mediaUpdated = 0;
    
    const clientFolder = path.join(__dirname, '..', 'uploads', clientId);
    if (!fs.existsSync(clientFolder)) {
      fs.mkdirSync(clientFolder, { recursive: true });
      console.log(`📁 Created folder: uploads/${clientId}/`);
    }
    
    for (const media of mediaItems) {
      let needsUpdate = false;
      let newUrl = media.url;
      
      if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
        try {
          const urlPath = new URL(media.url).pathname;
          const filename = path.basename(urlPath);
          newUrl = `/uploads/${clientId}/${filename}`;
          
          const oldPath = path.join(__dirname, '..', urlPath.replace(/^\//, ''));
          const newPath = path.join(__dirname, '..', 'uploads', clientId, filename);
          
          if (fs.existsSync(oldPath)) {
            fs.copyFileSync(oldPath, newPath);
            console.log(`✅ Moved media: ${filename}`);
          } else {
            console.log(`⚠️  File not found: ${oldPath}`);
          }
          
          needsUpdate = true;
        } catch (err) {
          console.log(`⚠️  Error processing ${media.url}: ${err.message}`);
        }
      }
      else if (!media.url.includes(`/uploads/${clientId}/`)) {
        const filename = path.basename(media.url);
        newUrl = `/uploads/${clientId}/${filename}`;
        
        const oldPath = path.join(__dirname, '..', media.url.replace(/^\//, ''));
        const newPath = path.join(__dirname, '..', 'uploads', clientId, filename);
        
        if (fs.existsSync(oldPath)) {
          fs.copyFileSync(oldPath, newPath);
          console.log(`✅ Moved media: ${filename}`);
        } else {
          console.log(`⚠️  File not found: ${oldPath}`);
        }
        
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await db.collection('media').updateOne(
          { _id: media._id },
          { $set: { url: newUrl } }
        );
        mediaUpdated++;
      }
    }
    
    console.log(`✅ Media migration complete! Updated ${mediaUpdated} items`);
    
    console.log('\n📝 Migrating Posts collection...');
    const posts = await db.collection('posts').find({ 
      featuredImage: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`📊 Found ${posts.length} posts with images`);
    
    let postsUpdated = 0;
    
    for (const post of posts) {
      const updates = {};
      let needsUpdate = false;
      
      if (post.featuredImage) {
  // Skip if featuredImage is not a string
  if (typeof post.featuredImage !== 'string') {
    console.log(`⚠️  Skipping post "${post.title}": featuredImage is not a string (type: ${typeof post.featuredImage})`);
    continue;
  }
  
  let newImagePath = post.featuredImage;
  
  if (post.featuredImage.startsWith('http://') || post.featuredImage.startsWith('https://')) {
          try {
            const urlPath = new URL(post.featuredImage).pathname;
            const filename = path.basename(urlPath);
            newImagePath = `/uploads/${clientId}/${filename}`;
            
            const oldPath = path.join(__dirname, '..', urlPath.replace(/^\//, ''));
            const newPath = path.join(__dirname, '..', 'uploads', clientId, filename);
            
            if (fs.existsSync(oldPath)) {
              fs.copyFileSync(oldPath, newPath);
              console.log(`✅ Moved post image: ${filename}`);
            }
            
            updates.featuredImage = newImagePath;
            needsUpdate = true;
          } catch (err) {
            console.log(`⚠️  Error processing ${post.featuredImage}: ${err.message}`);
          }
        }
        else if (!post.featuredImage.includes(`/uploads/${clientId}/`)) {
          const filename = path.basename(post.featuredImage);
          newImagePath = `/uploads/${clientId}/${filename}`;
          
          const oldPath = path.join(__dirname, '..', post.featuredImage.replace(/^\//, ''));
          const newPath = path.join(__dirname, '..', 'uploads', clientId, filename);
          
          if (fs.existsSync(oldPath)) {
            fs.copyFileSync(oldPath, newPath);
            console.log(`✅ Moved post image: ${filename}`);
          }
          
          updates.featuredImage = newImagePath;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await db.collection('posts').updateOne(
          { _id: post._id },
          { $set: updates }
        );
        postsUpdated++;
      }
    }
    
    console.log(`✅ Posts migration complete! Updated ${postsUpdated} posts`);
    console.log(`\n📁 All images moved to /uploads/${clientId}/`);
    console.log('\n🎉 Migration completed successfully!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateImageUrls();