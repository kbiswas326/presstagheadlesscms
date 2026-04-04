async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const id = process.argv[3];
  const backendOrigin = (process.argv[4] || 'http://localhost:5001').replace(/\/+$/, '');
  if (!id) throw new Error('Usage: node scripts/fetch_debug_raw.js <tenantId> <postId> [backendOrigin]');

  const res = await fetch(`${backendOrigin}/api/posts/__debug/raw/${id}`, {
    headers: { 'x-tenant-id': tenantId },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);

  process.stdout.write(
    JSON.stringify(
      { ok: res.ok, status: res.status, tenantId, id, json },
      null,
      2
    ) + '\n'
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

