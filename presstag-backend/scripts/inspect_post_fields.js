const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const status = process.argv[3] || 'published';

  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');

  const client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    family: 4,
    tlsAllowInvalidCertificates: true,
  });
  await client.connect();

  const db = client.db(tenantId);
  const post = await db.collection('posts').findOne(
    { status },
    { sort: { publishedAt: -1, createdAt: -1 } }
  );

  if (!post) {
    process.stdout.write(JSON.stringify({ tenantId, status, found: false }, null, 2) + '\n');
    await client.close();
    return;
  }

  const keys = Object.keys(post).sort();
  const interesting = keys.filter((k) => /cat|categ|author|user|tag/i.test(k));

  const pick = {};
  for (const k of interesting) pick[k] = post[k];

  process.stdout.write(
    JSON.stringify(
      {
        tenantId,
        status,
        found: true,
        id: String(post._id),
        slug: post.slug || null,
        title: post.title || null,
        interestingKeys: interesting,
        interestingValues: pick,
      },
      null,
      2
    ) + '\n'
  );

  await client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

