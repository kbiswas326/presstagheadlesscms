import { resolveSiteAssetUrl } from '../lib/seo';

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toAbsoluteUrl(value, origin) {
  const resolved = resolveSiteAssetUrl(value);
  if (!resolved) return undefined;
  try {
    return new URL(resolved, origin).toString();
  } catch {
    return undefined;
  }
}

function getAuthorNames(post) {
  const authors = Array.isArray(post.authors) && post.authors.length > 0
    ? post.authors
    : [post.author];

  return authors
    .map(author => {
      if (typeof author === 'string') {
        const name = author.trim();
        return /^[a-f\d]{24}$/i.test(name) ? '' : name;
      }
      return String(author?.name || '').trim();
    })
    .filter(Boolean)
    .map(name => ({ '@type': 'Person', name }));
}

export default function ArticleStructuredData({ post, canonicalPath, siteName, siteUrl, publisherLogo }) {
  if (!canonicalPath) return null;

  let origin;
  let articleUrl;
  try {
    const rawSiteUrl = String(siteUrl || '').trim();
    const normalizedSiteUrl = rawSiteUrl.startsWith('//')
      ? `https:${rawSiteUrl}`
      : (/^https?:\/\//i.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`);
    origin = new URL(normalizedSiteUrl).origin;
    articleUrl = new URL(canonicalPath, origin).toString();
  } catch {
    return null;
  }

  const image = toAbsoluteUrl(
    post?.seo?.ogImage ||
    post?.featuredImage?.url ||
    post?.featuredImage ||
    post?.banner_image ||
    post?.coverImage,
    origin
  );
  const description = String(
    post?.seo?.metaDescription ||
    post?.summary ||
    post?.sub_title ||
    post?.content ||
    ''
  )
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
  const publishedAt = toIsoDate(post?.publishedAt || post?.publishDate || post?.createdAt);
  const modifiedAt = toIsoDate(post?.updatedAt || post?.publishedAt || post?.publishDate || post?.createdAt);
  const authors = getAuthorNames(post);
  const logo = toAbsoluteUrl(publisherLogo, origin);
  const category = Array.isArray(post?.categories) ? post.categories[0] : null;
  const categoryName = typeof category === 'string'
    ? category
    : String(category?.name || category?.title || category?.slug || '').trim();
  const categorySlug = typeof category === 'string'
    ? category
    : String(category?.slug || category?.name || category?.title || '').trim();

  const breadcrumbItems = [
    { name: 'Home', item: new URL('/', origin).toString() },
  ];
  if (categoryName && categorySlug) {
    breadcrumbItems.push({
      name: categoryName,
      item: new URL(`/category/${encodeURIComponent(categorySlug)}`, origin).toString(),
    });
  }
  breadcrumbItems.push({ name: String(post?.title || '').trim(), item: articleUrl });

  const graph = [
    {
      '@type': 'NewsArticle',
      headline: String(post?.title || '').trim(),
      mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
      url: articleUrl,
      ...(categoryName ? { articleSection: categoryName } : {}),
      ...(description ? { description } : {}),
      ...(image ? { image: [image] } : {}),
      ...(publishedAt ? { datePublished: publishedAt } : {}),
      ...(modifiedAt ? { dateModified: modifiedAt } : {}),
      ...(authors.length > 0 ? { author: authors } : {}),
      publisher: {
        '@type': 'Organization',
        name: siteName,
        ...(logo ? { logo: { '@type': 'ImageObject', url: logo } } : {}),
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    },
  ];

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />;
}
