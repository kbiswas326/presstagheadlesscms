const User = require('../models/User');
const { connectDB } = require('../config/db');

async function main() {
  const tenant = process.argv[2] || 'sportzpoint';
  const id = process.argv[3];
  if (!id) {
    console.error('Usage: node scripts/test-user-findbyid.js <tenant> <id>');
    process.exit(1);
  }
  await connectDB();
  const user = await User.findById(id, tenant);
  console.log(JSON.stringify({ tenant, found: !!user, user }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
