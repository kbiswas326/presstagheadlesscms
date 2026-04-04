const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const rawId = process.argv[3];
  if (!rawId) throw new Error('Usage: node scripts/inspect_category.js <tenantId> <id>');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');

  const client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    family: 4,
    tlsAllowInvalidCertificates: true,
  });
  await client.connect();
  const db = client.db(tenantId);

  const byString = await db.collection('categories').findOne({ _id: rawId });
  const byObjectId = ObjectId.isValid(rawId)
    ? await db.collection('categories').findOne({ _id: new ObjectId(rawId) })
    : null;

  process.stdout.write(
    JSON.stringify(
      {
        tenantId,
        rawId,
        objectIdValid: ObjectId.isValid(rawId),
        foundByStringId: !!byString,
        foundByObjectId: !!byObjectId,
        sample: byObjectId || byString || null,
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

