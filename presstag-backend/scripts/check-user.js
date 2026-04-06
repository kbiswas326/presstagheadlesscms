const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('../config/db');

async function main() {
  const tenant = process.argv[2] || process.env.TENANT || 'sportzpoint';
  const id = process.argv[3];
  if (!id || !ObjectId.isValid(id)) {
    console.error('Provide a valid user id');
    process.exit(1);
  }

  await connectDB();
  const db = getDB(tenant);
  const user = await db.collection('users').findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
  console.log(JSON.stringify({ tenant, found: !!user, user }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
