const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const tenantId = String(process.argv[2] || 'sportzpoint').trim();
  const status = String(process.argv[3] || 'published').trim();

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  const client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    family: 4,
    tlsAllowInvalidCertificates: true,
  });

  await client.connect();
  try {
    const db = client.db(tenantId);
    const posts = db.collection('posts');

    const totalByStatus = await posts.countDocuments({ status });
    const byType = await posts
      .aggregate([
        { $match: { status } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    process.stdout.write(
      JSON.stringify(
        {
          tenantId,
          status,
          totalByStatus,
          byType,
        },
        null,
        2
      ) + '\n'
    );
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
