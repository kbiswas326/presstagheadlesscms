async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const backendOrigin = process.argv[3] || 'http://localhost:5001';
  const frontendOrigin = process.argv[4] || 'http://localhost:3001';

  const backendApi = backendOrigin.replace(/\/+$/, '') + '/api';

  const headers = { 'x-tenant-id': tenantId };

  const layoutRes = await fetch(`${backendApi}/layout-config`, { headers, cache: 'no-store' });
  if (!layoutRes.ok) {
    throw new Error(`layout-config failed: ${layoutRes.status}`);
  }
  const layout = await layoutRes.json();
  const siteTitle = layout?.branding?.siteTitle || '';

  const postsRes = await fetch(`${backendApi}/posts?status=published&limit=1&page=1`, { headers, cache: 'no-store' });
  if (!postsRes.ok) {
    throw new Error(`posts page failed: ${postsRes.status}`);
  }
  const postsData = await postsRes.json();
  const firstPost = Array.isArray(postsData) ? postsData[0] : (postsData.posts || [])[0];
  const slugOrId = firstPost?.slug || firstPost?._id;

  const homeRes = await fetch(`${frontendOrigin}/`, { cache: 'no-store' });
  const homeOk = homeRes.ok;
  const homeHtml = homeOk ? await homeRes.text() : '';

  const postRes = slugOrId ? await fetch(`${frontendOrigin}/posts/${slugOrId}`, { cache: 'no-store' }) : null;
  const postOk = postRes ? postRes.ok : false;

  const result = {
    tenantId,
    backendOrigin,
    frontendOrigin,
    siteTitle,
    firstPost: slugOrId ? { idOrSlug: slugOrId, type: firstPost?.type || null, title: firstPost?.title || null } : null,
    checks: {
      backendLayoutConfigOk: true,
      backendPostsOk: true,
      frontendHomeOk: homeOk,
      frontendPostOk: postOk,
      frontendHomeContainsSiteTitle: siteTitle ? homeHtml.includes(siteTitle) : null,
    },
  };

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
