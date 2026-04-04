async function run() {
  const tenantId = process.argv[2] || 'sportzpoint';
  const backendOrigin = (process.argv[3] || 'http://localhost:5001').replace(/\/+$/, '');
  const backendApi = backendOrigin + '/api';

  const fetchPage = async (page) => {
    const res = await fetch(`${backendApi}/posts?status=published&limit=50&page=${page}`, {
      headers: { 'x-tenant-id': tenantId },
      cache: 'no-store',
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    const posts = Array.isArray(json) ? json : (json?.posts || []);
    return { res, posts };
  };

  const first = await fetchPage(1);
  const res = first.res;
  let posts = first.posts;
  const pick = (p) => ({
    id: p?._id || null,
    slug: p?.slug || null,
    title: p?.title || null,
    rawCategoryField: p?.category ?? null,
    rawPrimaryCategoryField: p?.primary_category ?? null,
    rawCategoriesField: p?.categories ?? null,
    category0: p?.categories?.[0] || null,
    categoriesCount: Array.isArray(p?.categories) ? p.categories.length : null,
    author: p?.author || null,
  });

  const hasAnyCategory = (p) => {
    const hasCats = Array.isArray(p?.categories) && p.categories.length > 0;
    const hasPrimary = Array.isArray(p?.primary_category) ? p.primary_category.length > 0 : !!p?.primary_category;
    const hasLegacy = !!p?.category;
    return hasCats || hasPrimary || hasLegacy;
  };

  let firstWithCategory = posts.find(hasAnyCategory) || null;
  let pageSearched = 1;
  while (!firstWithCategory && pageSearched < 30) {
    pageSearched += 1;
    const next = await fetchPage(pageSearched);
    if (!next.res.ok) break;
    firstWithCategory = next.posts.find(hasAnyCategory) || null;
  }

  const sample = posts.slice(0, 3).map(pick);

  process.stdout.write(
    JSON.stringify(
      {
        tenantId,
        backendOrigin,
        status: res.status,
        ok: res.ok,
        sample,
        firstWithCategory: firstWithCategory ? pick(firstWithCategory) : null,
        pagesSearched: pageSearched,
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
