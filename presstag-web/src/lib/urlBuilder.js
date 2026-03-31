// web> src> lib> urlBuilder.js — builds post URLs based on admin SEO config

export function buildPostUrl(post, urlStructure = '/{category}/{slug}') {
  // Web stories always use their own route
  const cleanType = post.type?.toLowerCase().trim();
  const isWebStory = cleanType === 'web story' || cleanType === 'web-story' || cleanType === 'story';
  if (isWebStory) return `/web-stories/${post.slug || post._id}`;

  const category = post.categories?.[0]?.slug || post.primary_category?.[0]?.slug || 'general';
  const slug = post.slug || post._id;
  const author = post.author?.slug || 'author';
  const date = new Date(post.publishedAt || post.publishDate || post.createdAt || Date.now());
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return urlStructure
    .replace('{category}', category)
    .replace('{slug}', slug)
    .replace('{author}', author)
    .replace('{year}', year)
    .replace('{month}', month);
}

// Parses a URL against a structure pattern and extracts the slug
// e.g. url: "/cricket/ipl-2025", structure: "/{category}/{slug}" → "ipl-2025"
export function extractSlugFromUrl(urlParts, urlStructure = '/{category}/{slug}') {
  // Split structure into parts, filter empty strings
  const structureParts = urlStructure.split('/').filter(Boolean);
  
  // Find which position {slug} is in
  const slugIndex = structureParts.findIndex(p => p === '{slug}');
  
  if (slugIndex === -1) return null;
  
  return urlParts[slugIndex] || null;
}