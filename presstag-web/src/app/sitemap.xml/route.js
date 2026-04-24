import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { buildPageUrl, buildPageUrlByStructure, buildPostUrl, buildPostUrlByStructure } from '@/lib/urlBuilder';

const xmlEscape = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const resolveBaseUrl = (tenantConfig) => {
  const configUrl = String(tenantConfig?.branding?.siteUrl || '').trim();
  const explicit = String(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
  const inferred = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  const base = configUrl || explicit || inferred || 'http://localhost:3001';
  try {
    return new URL(base).origin;
  } catch {
    return 'http://localhost:3001';
  }
};

export async function GET() {
  const [config, latest] = await Promise.all([
    fetchWithTenant('/layout-config', { next: { revalidate: 3600 } })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetchWithTenant('/posts?status=published&page=1&limit=200&lite=1', { next: { revalidate: 600 } })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const baseUrl = resolveBaseUrl(config);
  const posts = Array.isArray(latest?.posts) ? latest.posts : [];
  const preservePostUrls = Boolean(config?.seo?.preservePostUrls);
  const postUrlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  const pageUrlStructure = config?.seo?.pageUrlStructure || '/{slug}';

  const urls = new Map();
  urls.set(`${baseUrl}/`, { loc: `${baseUrl}/`, changefreq: 'hourly', priority: '1.0' });

  for (const post of posts) {
    const slug = post?.slug || post?._id;
    if (!slug) continue;

    const cleanType = String(post?.type || '').toLowerCase().trim();
    const isCustomPage = cleanType === 'custompage' || cleanType === 'custom-page' || cleanType === 'custom page';
    const path = isCustomPage
      ? (preservePostUrls ? buildPageUrl(post, pageUrlStructure) : buildPageUrlByStructure(post, pageUrlStructure))
      : (preservePostUrls ? buildPostUrl(post, postUrlStructure) : buildPostUrlByStructure(post, postUrlStructure));

    if (path) {
      urls.set(`${baseUrl}${path}`, {
        loc: `${baseUrl}${path}`,
        lastmod: post?.updatedAt || post?.publishedAt || post?.createdAt || null,
        changefreq: 'daily',
        priority: isCustomPage ? '0.6' : '0.8',
      });
    }

    const categories = Array.isArray(post?.categories) ? post.categories : [];
    const firstCat = categories[0];
    const catSlug = typeof firstCat === 'string' ? firstCat : (firstCat?.slug || firstCat?.name);
    if (catSlug) {
      urls.set(`${baseUrl}/category/${encodeURIComponent(String(catSlug))}`, {
        loc: `${baseUrl}/category/${encodeURIComponent(String(catSlug))}`,
        changefreq: 'daily',
        priority: '0.6',
      });
    }
  }

  const urlEntries = Array.from(urls.values()).map((u) => {
    const parts = [
      '<url>',
      `<loc>${xmlEscape(u.loc)}</loc>`,
    ];
    if (u.lastmod) parts.push(`<lastmod>${xmlEscape(new Date(u.lastmod).toISOString())}</lastmod>`);
    if (u.changefreq) parts.push(`<changefreq>${xmlEscape(u.changefreq)}</changefreq>`);
    if (u.priority) parts.push(`<priority>${xmlEscape(u.priority)}</priority>`);
    parts.push('</url>');
    return parts.join('');
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries,
    '</urlset>',
  ].join('');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}

