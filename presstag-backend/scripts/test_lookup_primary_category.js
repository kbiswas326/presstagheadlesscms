const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const postId = process.argv[3];
  if (!postId) throw new Error('Usage: node scripts/test_lookup_primary_category.js <tenantId> <postId>');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');

  const client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    family: 4,
    tlsAllowInvalidCertificates: true,
  });
  await client.connect();
  const db = client.db(tenantId);

  const rows = await db.collection('posts').aggregate([
    { $match: { _id: new ObjectId(postId) } },
    { $limit: 1 },
    { $project: { primary_category: 1, categories: 1 } },
    { $lookup: { from: 'categories', localField: 'primary_category', foreignField: '_id', as: 'primaryCategoryPop' } },
  ]).toArray();

  process.stdout.write(JSON.stringify(rows[0] || null, null, 2) + '\n');
  await client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

