async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const postIdOrSlug = process.argv[3];
  const backendOrigin = (process.argv[4] || 'http://localhost:5001').replace(/\/+$/, '');
  if (!postIdOrSlug) throw new Error('Usage: node scripts/fetch_post_api.js <tenantId> <idOrSlug> [backendOrigin]');
  const backendApi = backendOrigin + '/api';

  const res = await fetch(`${backendApi}/posts/${postIdOrSlug}`, {
    headers: { 'x-tenant-id': tenantId },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);

  process.stdout.write(
    JSON.stringify(
      {
        tenantId,
        backendOrigin,
        ok: res.ok,
        status: res.status,
        idOrSlug: postIdOrSlug,
        categories: json?.categories ?? null,
        primary_category: json?.primary_category ?? null,
        category: json?.category ?? null,
        author: json?.author ?? null,
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

