const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sportzpoint_v2";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const post = await db.collection('posts').findOne({ slug: 'stunning-visuals-from-around-the-world' });
        
        if (post) {
            console.log('Post found:', post._id);
            console.log('Type:', post.type);
            console.log('Gallery field:', post.gallery);
            console.log('Keys:', Object.keys(post));
        } else {
            console.log('Post not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
