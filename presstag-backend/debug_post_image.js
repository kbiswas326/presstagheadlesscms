const { MongoClient } = require('mongodb');
const { getDB, connectDB } = require('./config/db');

const slug = 'argentina-vs-spain-finalissima-2026-when-and-where-to-watch-the-clash-of-champions';

async function run() {
    try {
        await connectDB();
        const db = getDB();
        
        console.log(`Searching for post with slug: ${slug}`);
        const post = await db.collection('posts').findOne({ slug: slug });
        
        if (!post) {
            console.log('Post not found!');
        } else {
            console.log('Post found:');
            console.log('Title:', post.title);
            console.log('Type:', post.type);
            console.log('featuredImage:', post.featuredImage);
            console.log('banner_image:', post.banner_image);
            console.log('coverImage:', post.coverImage);
            console.log('Full Post Object Keys:', Object.keys(post));
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
