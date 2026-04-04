require('dotenv').config();
const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('../config/db');

async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const postId = process.argv[3];
  if (!postId) throw new Error('Usage: node scripts/inspect_post_via_getdb.js <tenantId> <postId>');

  await connectDB();
  const db = getDB(tenantId);

  const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
  process.stdout.write(
    JSON.stringify(
      {
        tenantId,
        postId,
        primary_category: post?.primary_category ?? null,
        categories: post?.categories ?? null,
        author: post?.author ?? null,
      },
      null,
      2
    ) + '\n'
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

