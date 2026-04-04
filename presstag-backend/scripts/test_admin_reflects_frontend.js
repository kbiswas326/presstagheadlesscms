const { MongoClient } = require('mongodb');
require('dotenv').config();

const normalizeApiBase = (raw) => {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:5001';
  return trimmed;
};

const makeTestColor = () => {
  const n = Date.now() % 0xffffff;
  return '#' + n.toString(16).padStart(6, '0');
};

async function run() {
  const tenantId = String(process.argv[2] || 'sportzpoint').trim();
  const backendOrigin = normalizeApiBase(process.argv[3] || 'http://localhost:5001');
  const frontendOrigin = normalizeApiBase(process.argv[4] || 'http://localhost:3001');

  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');

  const client = new MongoClient(process.env.MONGO_URI, {
    tls: true,
    family: 4,
    tlsAllowInvalidCertificates: true,
  });

  await client.connect();
  const db = client.db(tenantId);
  const layout = db.collection('layout_config');

  const beforeDoc = await layout.findOne({});
  const beforeBranding = beforeDoc?.branding;
  const beforeColor = beforeDoc?.branding?.primaryColor || null;
  const testColor = makeTestColor();

  const updateRes = await layout.updateOne(
    {},
    [
      { $set: { branding: { $ifNull: ['$branding', {}] } } },
      { $set: { 'branding.primaryColor': testColor, updatedAt: new Date() } },
    ],
    { upsert: true }
  );

  const backendApi = backendOrigin + '/api';
  const layoutRes = await fetch(`${backendApi}/layout-config`, {
    headers: { 'x-tenant-id': tenantId },
    cache: 'no-store',
  });
  const layoutJson = await layoutRes.json().catch(() => null);
  const backendSeenColor = layoutJson?.branding?.primaryColor || null;

  const homeRes = await fetch(`${frontendOrigin}/`, { cache: 'no-store' });
  const homeText = await homeRes.text();
  const frontendContainsTestColor = homeText.includes(testColor);

  if (beforeBranding === null) {
    await layout.updateOne({}, { $set: { branding: null, updatedAt: new Date() } }, { upsert: true });
  } else if (beforeColor) {
    await layout.updateOne({}, [{ $set: { branding: { $ifNull: ['$branding', {}] } } }, { $set: { 'branding.primaryColor': beforeColor, updatedAt: new Date() } }], { upsert: true });
  } else {
    await layout.updateOne({}, [{ $set: { branding: { $ifNull: ['$branding', {}] } } }, { $unset: 'branding.primaryColor' }, { $set: { updatedAt: new Date() } }], { upsert: true });
  }

  await client.close();

  process.stdout.write(
    JSON.stringify(
      {
        tenantId,
        backendOrigin,
        frontendOrigin,
        beforeColor,
        testColor,
        mongoUpdate: {
          matchedCount: updateRes.matchedCount,
          modifiedCount: updateRes.modifiedCount,
          upsertedId: updateRes.upsertedId || null,
        },
        backendLayoutConfig: {
          ok: layoutRes.ok,
          status: layoutRes.status,
          seenPrimaryColor: backendSeenColor,
        },
        frontendHome: {
          ok: homeRes.ok,
          status: homeRes.status,
          containsTestColor: frontendContainsTestColor,
        },
      },
      null,
      2
    ) + '\n'
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
