const { connectDB, getDB } = require('../config/db');

async function main() {
  const tenant = process.argv[2] || 'sportzpoint';
  const slug = process.argv[3];
  if (!slug) {
    console.error('Usage: node scripts/inspect-user-types.js <tenant> <slug>');
    process.exit(1);
  }

  await connectDB();
  const db = getDB(tenant);
  const user = await db.collection('users').findOne({ slug }, { projection: { password: 0 } });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  console.log(JSON.stringify({
    tenant,
    slug,
    _idType: user._id?.constructor?.name || typeof user._id,
    _idValue: user._id,
    name: user.name,
  }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
