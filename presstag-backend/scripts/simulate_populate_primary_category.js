const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value);
  if (typeof value === 'object') {
    const candidate = value._id || value.id;
    if (candidate instanceof ObjectId) return candidate;
    if (typeof candidate === 'string' && ObjectId.isValid(candidate)) return new ObjectId(candidate);
  }
  return null;
};

async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const postId = process.argv[3];
  if (!postId) throw new Error('Usage: node scripts/simulate_populate_primary_category.js <tenantId> <postId>');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');

  const client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    family: 4,
    tlsAllowInvalidCertificates: true,
  });
  await client.connect();
  const db = client.db(tenantId);

  const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
  const rawPrimary = Array.isArray(post?.primary_category) ? post.primary_category[0] : post?.primary_category;
  const oid = toObjectId(rawPrimary);
  const category = oid ? await db.collection('categories').findOne({ _id: oid }) : null;

  process.stdout.write(
    JSON.stringify(
      {
        tenantId,
        postId,
        rawPrimary,
        rawPrimaryType: typeof rawPrimary,
        rawPrimaryLength: typeof rawPrimary === 'string' ? rawPrimary.length : null,
        oid: oid ? String(oid) : null,
        foundCategory: !!category,
        category,
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

