// web> src> lib> urlBuilder.js — builds post URLs based on admin SEO config

function normalizePath(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      return new URL(raw).pathname || '';
    } catch {
      return raw;
    }
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function buildPostUrlByStructure(post, urlStructure = '/{category}/{slug}') {
  if (!post) return null;
  const cleanType = String(post.type || '').toLowerCase().trim();
  const isWebStory = cleanType === 'web story' || cleanType === 'web-story' || cleanType === 'story';
  if (isWebStory) return `/web-stories/${post.slug || post._id}`;

  const cleanStructure = normalizePath(urlStructure || '/{category}/{slug}') || '/{category}/{slug}';
  const category = post.categories?.[0]?.slug || post.primary_category?.[0]?.slug || 'general';
  const slug = post.slug || post._id;
  const author = post.author?.slug || 'author';
  const date = new Date(post.publishedAt || post.publishDate || post.createdAt || Date.now());
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return cleanStructure
    .replace('{category}', String(category))
    .replace('{slug}', String(slug))
    .replace('{author}', String(author))
    .replace('{year}', year)
    .replace('{month}', month);
}

export function buildPostUrl(post, urlStructure = '/{category}/{slug}') {
  // Use original URL if preserved from migration
  if (post.originalUrl) return normalizePath(post.originalUrl) || null

  // Web stories always use their own route
  const cleanType = String(post.type || '').toLowerCase().trim();
  const isWebStory = cleanType === 'web story' || cleanType === 'web-story' || cleanType === 'story';
  if (isWebStory) return `/web-stories/${post.slug || post._id}`;
  return buildPostUrlByStructure(post, urlStructure);
}

export function buildPageUrlByStructure(page, pageUrlStructure = '/{slug}') {
  if (!page) return null;
  const cleanStructure = normalizePath(pageUrlStructure || '/{slug}') || '/{slug}';
  const slug = page.slug || page._id;
  return cleanStructure.replace('{slug}', String(slug));
}

export function buildPageUrl(page, pageUrlStructure = '/{slug}') {
  if (!page) return null;
  if (page.originalUrl) return normalizePath(page.originalUrl) || null;
  return buildPageUrlByStructure(page, pageUrlStructure);
}

// Parses a URL against a structure pattern and extracts the slug
// e.g. url: "/cricket/ipl-2025", structure: "/{category}/{slug}" → "ipl-2025"
export function extractSlugFromUrl(urlParts, urlStructure = '/{category}/{slug}') {
  const incoming = Array.isArray(urlParts) ? urlParts : [];
  const structureParts = String(urlStructure || '').split('/').filter(Boolean);
  if (structureParts.length !== incoming.length) return null;

  const slugIndex = structureParts.findIndex((p) => p === '{slug}');
  if (slugIndex === -1) return null;
  for (let i = 0; i < structureParts.length; i += 1) {
    const part = structureParts[i];
    if (part === '{slug}') continue;
    if (part !== incoming[i]) return null;
  }
  return incoming[slugIndex] || null;
}
