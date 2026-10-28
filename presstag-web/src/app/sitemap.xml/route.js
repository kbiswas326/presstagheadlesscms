import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { buildPageUrl, buildPageUrlByStructure, buildPostUrl, buildPostUrlByStructure } from '@/lib/urlBuilder';

const PAGE_LIMIT = 200;
const PAGES_PER_SITEMAP = 50;

const xmlEscape = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const resolveBaseUrl = (tenantConfig, requestUrl) => {
  const configUrl = String(tenantConfig?.branding?.siteUrl || '').trim();
  const explicit = String(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
  const inferred = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  const rawBase = configUrl || explicit || inferred || requestUrl;
  const base = /^https?:\/\//i.test(rawBase) ? rawBase : `https://${rawBase}`;
  try {
    return new URL(base).origin;
  } catch {
    return new URL(requestUrl).origin;
  }
};

async function fetchJson(path) {
  try {
    const response = await fetchWithTenant(path, { next: { revalidate: 600 } });
    if (response.ok) return response.json();
    console.error(`Sitemap request failed (${response.status}): ${path}`);
  } catch (error) {
    console.error(`Sitemap request failed: ${path}`, error);
  }
  return null;
}

function getPostPath(post, config) {
  const preservePostUrls = Boolean(config?.seo?.preservePostUrls);
  const postUrlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  const pageUrlStructure = config?.seo?.pageUrlStructure || '/{slug}';
  const slug = post?.slug || post?._id;
  if (!slug) return null;

  const cleanType = String(post?.type || '').toLowerCase().trim();
  const isCustomPage = ['custompage', 'custom-page', 'custom page'].includes(cleanType);
  return isCustomPage
    ? (preservePostUrls ? buildPageUrl(post, pageUrlStructure) : buildPageUrlByStructure(post, pageUrlStructure))
    : (preservePostUrls ? buildPostUrl(post, postUrlStructure) : buildPostUrlByStructure(post, postUrlStructure));
}

function makeUrlEntry(entry) {
  const parts = ['<url>', `<loc>${xmlEscape(entry.loc)}</loc>`];
  if (entry.lastmod) {
    const date = new Date(entry.lastmod);
    if (!Number.isNaN(date.getTime())) parts.push(`<lastmod>${date.toISOString()}</lastmod>`);
  }
  if (entry.changefreq) parts.push(`<changefreq>${xmlEscape(entry.changefreq)}</changefreq>`);
  if (entry.priority) parts.push(`<priority>${xmlEscape(entry.priority)}</priority>`);
  parts.push('</url>');
  return parts.join('');
}

function urlsetResponse(entries) {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(makeUrlEntry),
    '</urlset>',
  ].join('');
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const [config, firstPage, categoryData, tagData] = await Promise.all([
    fetchJson('/layout-config'),
    fetchJson(`/posts?status=published&page=1&limit=${PAGE_LIMIT}&lite=1`),
    fetchJson('/categories'),
    fetchJson('/tags'),
  ]);
  const baseUrl = resolveBaseUrl(config, requestUrl.origin);
  const posts = Array.isArray(firstPage?.posts) ? firstPage.posts : [];
  const reportedTotal = Number(firstPage?.pagination?.total);
  const totalPosts = Number.isSafeInteger(reportedTotal) && reportedTotal >= 0
    ? Math.max(posts.length, reportedTotal)
    : posts.length;
  const totalPages = Math.ceil(totalPosts / PAGE_LIMIT);
  const sitemapCount = Math.ceil(totalPosts / (PAGE_LIMIT * PAGES_PER_SITEMAP));
  const part = requestUrl.searchParams.get('part');

  if (!part) {
    const sitemaps = [
      `${baseUrl}/sitemap.xml?part=taxonomy`,
      ...Array.from({ length: sitemapCount }, (_, index) =>
        `${baseUrl}/sitemap.xml?part=posts-${index + 1}`
      ),
    ];
    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...sitemaps.map(loc => `<sitemap><loc>${xmlEscape(loc)}</loc></sitemap>`),
      '</sitemapindex>',
    ].join('');
    return new Response(body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  }

  if (part === 'taxonomy') {
    const urls = new Map();
    urls.set(`${baseUrl}/`, { loc: `${baseUrl}/`, changefreq: 'hourly', priority: '1.0' });

    for (const category of Array.isArray(categoryData?.categories) ? categoryData.categories : []) {
      if (Number(category?.postCount) === 0) continue;
      const slug = String(category?.slug || '').trim();
      if (!slug) continue;
      const loc = `${baseUrl}/category/${encodeURIComponent(slug)}`;
      urls.set(loc, { loc, changefreq: 'daily', priority: '0.6' });
    }

    const tagPrefix = String(config?.seo?.tagPrefix || 'tag').trim() === 'tags' ? 'tags' : 'tag';
    for (const tag of Array.isArray(tagData?.tags) ? tagData.tags : []) {
      if (Number(tag?.postCount) === 0) continue;
      const slug = String(tag?.slug || '').trim();
      if (!slug) continue;
      const loc = `${baseUrl}/${tagPrefix}/${encodeURIComponent(slug)}`;
      urls.set(loc, { loc, changefreq: 'daily', priority: '0.5' });
    }

    return urlsetResponse(Array.from(urls.values()));
  }

  const postPartMatch = /^posts-(\d+)$/.exec(part);
  if (!postPartMatch) return new Response('Unknown sitemap part', { status: 404 });
  const partNumber = Number(postPartMatch[1]);
  if (!Number.isSafeInteger(partNumber) || partNumber < 1 || partNumber > sitemapCount) {
    return new Response('Unknown sitemap part', { status: 404 });
  }

  const startPage = (partNumber - 1) * PAGES_PER_SITEMAP + 1;
  const endPage = Math.min(startPage + PAGES_PER_SITEMAP - 1, totalPages);
  const pageNumbers = Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, index) => startPage + index);
  const pageData = [];
  for (let index = 0; index < pageNumbers.length; index += 5) {
    const batch = pageNumbers.slice(index, index + 5);
    pageData.push(...await Promise.all(batch.map(async pageNumber => {
      if (pageNumber === 1) return firstPage;
      return fetchJson(`/posts?status=published&page=${pageNumber}&limit=${PAGE_LIMIT}&lite=1`);
    })));
  }
  const urls = new Map();

  for (const data of pageData) {
    const pagePosts = Array.isArray(data?.posts) ? data.posts : [];
    for (const post of pagePosts) {
      const path = getPostPath(post, config);
      if (!path) continue;
      const loc = new URL(path, baseUrl).toString();
      urls.set(loc, {
        loc,
        lastmod: post?.updatedAt || post?.publishedAt || post?.createdAt || null,
        changefreq: 'daily',
        priority: '0.8',
      });
    }
  }

  return urlsetResponse(Array.from(urls.values()));
}
