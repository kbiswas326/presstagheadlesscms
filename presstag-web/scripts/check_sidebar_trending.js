async function run() {
  const backendOrigin = process.argv[2] || 'http://localhost:5001';
  const limit = Number(process.argv[3] || 5);
  const backendApi = backendOrigin.replace(/\/+$/, '') + '/api';

  const fetchTrending = async (tenantId) => {
    const res = await fetch(
      `${backendApi}/posts?sort=trending&status=published&limit=${limit}&page=1`,
      { headers: { 'x-tenant-id': tenantId }, cache: 'no-store' }
    );
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, body: text };
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, status: res.status, body: text };
    }
    const posts = Array.isArray(data) ? data : (data.posts || []);
    return {
      ok: true,
      count: posts.length,
      sample: posts.slice(0, Math.min(5, posts.length)).map((p) => ({
        title: p.title || null,
        slug: p.slug || null,
        type: p.type || null,
        views: p.views ?? null,
      })),
    };
  };

  const sportzpoint = await fetchTrending('sportzpoint');
  const presstag = await fetchTrending('presstag');

  process.stdout.write(
    JSON.stringify(
      {
        backendOrigin,
        backendApi,
        limit,
        sportzpoint,
        presstag,
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

