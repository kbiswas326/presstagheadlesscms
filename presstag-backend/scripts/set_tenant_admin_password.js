require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcryptjs = require('bcryptjs');

async function main() {
  const tenantId = String(process.argv[2] || '').trim();
  const email = String(process.argv[3] || '').trim();
  const newPassword = String(process.argv[4] || '').trim();

  if (!tenantId || !email || !newPassword) {
    process.stderr.write('Usage: node scripts/set_tenant_admin_password.js <tenantId> <email> <newPassword>\n');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    process.stderr.write('MONGO_URI is missing in environment\n');
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    tls: true,
    family: 4,
    tlsAllowInvalidCertificates: true,
  });

  try {
    await client.connect();
    const db = client.db(tenantId);
    const users = db.collection('users');

    const existing = await users.findOne({ email });
    if (!existing) {
      process.stderr.write(`User not found in tenant DB "${tenantId}" for email "${email}"\n`);
      process.exit(2);
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await users.updateOne(
      { email },
      { $set: { password: hashedPassword, role: 'admin', updatedAt: new Date() } }
    );

    process.stdout.write(`Updated password for ${email} in ${tenantId} (role forced to admin)\n`);
  } finally {
    await client.close().catch(() => {});
  }
}

main().catch((err) => {
  process.stderr.write((err && err.stack) ? `${err.stack}\n` : `${String(err)}\n`);
  process.exit(1);
});

