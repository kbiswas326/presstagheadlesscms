export function buildPostUrl(post, urlStructure = '/{category}/{slug}') {
  const originalUrl = String(post?.originalUrl || '').trim();
  if (originalUrl) {
    if (originalUrl.startsWith('/')) return originalUrl;
    try {
      const u = new URL(originalUrl);
      return u.toString();
    } catch {
      return originalUrl;
    }
  }

  const cleanType = String(post?.type || '').toLowerCase().trim();
  const isWebStory = cleanType === 'web story' || cleanType === 'web-story' || cleanType === 'story';
  if (isWebStory) return `/web-stories/${post?.slug || post?._id}`;

  const firstCategory = Array.isArray(post?.categories) ? post.categories[0] : null;
  const rawCategory = typeof firstCategory === 'string'
    ? firstCategory
    : (firstCategory?.slug || firstCategory?.name || firstCategory?.title || '');

  const slugify = (value) =>
    String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const category = rawCategory ? slugify(rawCategory) : 'general';
  const slug = post?.slug || post?._id;
  const author = post?.author?.slug || post?.authorSlug || 'author';
  const date = new Date(post?.publishedAt || post?.publishDate || post?.createdAt || Date.now());
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return String(urlStructure || '/{category}/{slug}')
    .replace('{category}', category)
    .replace('{slug}', slug)
    .replace('{author}', author)
    .replace('{year}', year)
    .replace('{month}', month);
}
