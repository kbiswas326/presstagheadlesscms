export function buildPostUrl(post, urlStructure = '/{category}/{slug}') {
  const cleanType = String(post?.type || '').toLowerCase().trim();
  const isWebStory = cleanType === 'web story' || cleanType === 'web-story' || cleanType === 'story';
  if (isWebStory) return `/web-stories/${post?.slug || post?._id}`;

  const category = post?.categories?.[0]?.slug || post?.primary_category?.[0]?.slug || 'general';
  const slug = post?.slug || post?._id;
  const author = post?.author?.slug || 'author';
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

