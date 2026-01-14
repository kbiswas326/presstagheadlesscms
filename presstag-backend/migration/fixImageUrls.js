// migration/fixImageUrls.js
// Run this ONCE to convert existing absolute URLs to relative paths

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportzpoint', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const PostSchema = new mongoose.Schema({}, { strict: false });
const Post = mongoose.model('Post', PostSchema);

async function migrateImageUrls() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🚀 Connected to MongoDB');
    
    const db = client.db();
    
    // Migrate MEDIA collection
    console.log('\n📸 Migrating Media collection...');
    const mediaCollection = db.collection('media');
    const mediaItems = await mediaCollection.find({ url: { $exists: true } }).toArray();
    
    console.log(`📊 Found ${mediaItems.length} media items`);
    
    let mediaUpdated = 0;
    
    for (const media of mediaItems) {
      let needsUpdate = false;
      let newUrl = media.url;
      
      // Check if it's an absolute URL
      if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
        const urlPath = new URL(media.url).pathname;
        const filename = path.basename(urlPath);
        newUrl = `/uploads/${clientId}/${filename}`;
        
        // Move physical file
        const oldPath = path.join(__dirname, '..', urlPath);
        const newPath = path.join(__dirname, '..', 'uploads', clientId, filename);
        
        const clientFolder = path.join(__dirname, '..', 'uploads', clientId);
        if (!fs.existsSync(clientFolder)) {
          fs.mkdirSync(clientFolder, { recursive: true });
        }
        
        if (fs.existsSync(oldPath)) {
          try {
            fs.copyFileSync(oldPath, newPath);
            console.log(`✅ Moved media: ${filename}`);
          } catch (err) {
            console.log(`⚠️  Could not move ${filename}: ${err.message}`);
          }
        }
        
        needsUpdate = true;
      }
      // Check if it's relative but not in client folder
      else if (!media.url.includes(`/uploads/${clientId}/`)) {
        const filename = path.basename(media.url);
        newUrl = `/uploads/${clientId}/${filename}`;
        
        const oldPath = path.join(__dirname, '..', media.url);
        const newPath = path.join(__dirname, '..', 'uploads', clientId, filename);
        
        const clientFolder = path.join(__dirname, '..', 'uploads', clientId);
        if (!fs.existsSync(clientFolder)) {
          fs.mkdirSync(clientFolder, { recursive: true });
        }
        
        if (fs.existsSync(oldPath)) {
          try {
            fs.copyFileSync(oldPath, newPath);
            console.log(`✅ Moved media: ${filename}`);
          } catch (err) {
            console.log(`⚠️  Could not move ${filename}: ${err.message}`);
          }
        }
        
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await mediaCollection.updateOne(
          { _id: media._id },
          { $set: { url: newUrl } }
        );
        mediaUpdated++;
      }
    }
    
    console.log(`✅ Media migration complete! Updated ${mediaUpdated} items`);
    
    // Migrate POSTS collection
    console.log('\n📝 Migrating Posts collection...');
    const postsCollection = db.collection('posts');
    const posts = await postsCollection.find({ 
      $or: [
        { featuredImage: { $exists: true, $ne: null } },
        { images: { $exists: true, $ne: [] } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${posts.length} posts with images`);
    
    let postsUpdated = 0;
    
    for (const post of posts) {
      const updates = {};
      let needsUpdate = false;
      
      // Fix featuredImage
      if (post.featuredImage) {
        let newImagePath = post.featuredImage;
        
        if (post.featuredImage.startsWith('http://') || post.featuredImage.startsWith('https://')) {
          const urlPath = new URL(post.featuredImage).pathname;
          const filename = path.basename(urlPath);
          newImagePath = `/uploads/${clientId}/${filename}`;
          
          const oldPath = path.join(__dirname, '..', urlPath);
          const newPath = path.join(__dirname, '..', 'uploads', clientId, filename);
          
          const clientFolder = path.join(__dirname, '..', 'uploads', clientId);
          if (!fs.existsSync(clientFolder)) {
            fs.mkdirSync(clientFolder, { recursive: true });
          }
          
          if (fs.existsSync(oldPath)) {
            try {
              fs.copyFileSync(oldPath, newPath);
              console.log(`✅ Moved post image: ${filename}`);
            } catch (err) {
              console.log(`⚠️  Could not move ${filename}: ${err.message}`);
            }
          }
          
          updates.featuredImage = newImagePath;
          needsUpdate = true;
        }
        else if (!post.featuredImage.includes(`/uploads/${clientId}/`)) {
          const filename = path.basename(post.featuredImage);
          newImagePath = `/uploads/${clientId}/${filename}`;
          
          const oldPath = path.join(__dirname, '..', post.featuredImage);
          const newPath = path.join(__dirname, '..', 'uploads', clientId, filename);
          
          const clientFolder = path.join(__dirname, '..', 'uploads', clientId);
          if (!fs.existsSync(clientFolder)) {
            fs.mkdirSync(clientFolder, { recursive: true });
          }
          
          if (fs.existsSync(oldPath)) {
            try {
              fs.copyFileSync(oldPath, newPath);
              console.log(`✅ Moved post image: ${filename}`);
            } catch (err) {
              console.log(`⚠️  Could not move ${filename}: ${err.message}`);
            }
          }
          
          updates.featuredImage = newImagePath;
          needsUpdate = true;
        }
      }
      
      // Fix images array (if exists)
      if (post.images && Array.isArray(post.images) && post.images.length > 0) {
        const newImages = post.images.map(img => {
          if (img.startsWith('http://') || img.startsWith('https://')) {
            const urlPath = new URL(img).pathname;
            const filename = path.basename(urlPath);
            return `/uploads/${clientId}/${filename}`;
          } else if (!img.includes(`/uploads/${clientId}/`)) {
            const filename = path.basename(img);
            return `/uploads/${clientId}/${filename}`;
          }
          return img;
        });
        
        updates.images = newImages;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: updates }
        );
        postsUpdated++;
      }
    }
    
    console.log(`✅ Posts migration complete! Updated ${postsUpdated} posts`);
    console.log(`\n📁 All images moved to /uploads/${clientId}/`);
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run migration
migrateImageUrls();