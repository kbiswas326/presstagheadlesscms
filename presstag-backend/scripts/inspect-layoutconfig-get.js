const LayoutConfig = require('../models/LayoutConfig');
const { connectDB } = require('../config/db');

async function main() {
  const tenant = process.argv[2] || 'sportzpoint';
  await connectDB();
  const config = await LayoutConfig.get(tenant);
  const keys = config && typeof config === 'object' ? Object.keys(config).sort() : [];
  console.log(JSON.stringify({
    tenant,
    hasToJSON: !!(config && typeof config.toJSON === 'function'),
    keys,
  }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

