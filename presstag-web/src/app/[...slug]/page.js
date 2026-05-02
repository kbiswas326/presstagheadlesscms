///web> src> app> [...slug]> page.js | Catch-all route for dynamic post URLs. Extracts the slug from the last URL segment and fetches the post from the backend. Renders the same layout as posts/[id]/page.js regardless of URL structure set in admin.
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Merriweather } from 'next/font/google';
import VideoPlayer from '../../components/VideoPlayer';
import LiveBlogViewer from '../../components/LiveBlogViewer';
import GalleryClient from '../../components/GalleryClient';
import EmbedScripts from '../../components/EmbedScripts';
import AdSpot from '../../components/AdSpot';
import ArticleContent from '../../components/ArticleContent';
import SocialShareButtons from '../../components/SocialShareButtons';
import { getImageUrl, resolvePostImage } from '@/lib/imageHelper';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { buildOpenGraphImage, resolveSiteAssetUrl } from '@/lib/seo';
import SidebarDeferredClient from '../../components/SidebarDeferredClient';
import { formatPublishDateTime } from '../../util/timeFormat';
import { resolveTemplateId } from '@/lib/templates';
import { buildPageUrl, buildPageUrlByStructure, buildPostUrl, buildPostUrlByStructure, extractSlugFromUrl } from '@/lib/urlBuilder';

export const revalidate = 60;

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

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

function isCustomPageType(type) {
  const t = String(type || '').toLowerCase().trim();
  return t === 'custompage' || t === 'custom-page' || t === 'custom page';
}

async function getPostBySlug(slug) {
  try {
    const res = await fetchWithTenant(`/posts/slug/${encodeURIComponent(String(slug))}`, { next: { revalidate: 30 } });
    if (res.ok) return res.json();
  } catch (e) { console.error(e); }
  return null;
}

async function getPostByPreviousSlug(slug) {
  try {
    const res = await fetchWithTenant(`/posts?status=published&limit=1&previousSlug=${encodeURIComponent(String(slug))}&lite=1`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const posts = Array.isArray(data) ? data : (data.posts || []);
      if (posts.length > 0) return posts[0];
    }
  } catch (e) { console.error(e); }
  return null;
}

async function ensureCategories(post) {
  if (!post) return post;
  if (Array.isArray(post.categories) && post.categories.length > 0) return post;
  const ids = Array.isArray(post.primary_category) ? post.primary_category : (post.primary_category ? [post.primary_category] : []);
  if (ids.length === 0) return post;
  try {
    const res = await fetchWithTenant('/categories', { cache: 'no-store' });
    if (!res.ok) return post;
    const data = await res.json();
    const cats = data.categories || data || [];
    const map = new Map(cats.map((c) => [String(c?._id), c]));
    const resolved = ids.map((id) => map.get(String(id))).filter(Boolean);
    if (resolved.length > 0) return { ...post, categories: resolved };
  } catch {}
  return post;
}

function isUserObject(value) {
  return !!(value && typeof value === 'object' && (value._id || value.id) && (value.name || value.slug || value.email));
}

async function ensurePeople(post) {
  if (!post) return post;

  const fetchPublicUser = async (id) => {
    if (!id) return null;
    const res = await fetchWithTenant(`/users/public/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  };

  const authorObj = isUserObject(post.author) ? post.author : null;
  const primaryAuthorId = authorObj?._id ? String(authorObj._id) : (typeof post.author === 'string' ? post.author : '');

  const rawAuthors = Array.isArray(post.authors) ? post.authors : [];
  const authorObjects = rawAuthors.filter(isUserObject);
  const authorIds = rawAuthors
    .map((v) => (typeof v === 'string' ? v : String(v?._id || v?.id || '')))
    .filter(Boolean);

  const idsToFetch = authorIds.filter((id) => !authorObjects.some((u) => String(u._id || u.id) === String(id)));
  const fetchedAuthors = idsToFetch.length > 0 ? (await Promise.all(idsToFetch.map(fetchPublicUser))).filter(Boolean) : [];

  let resolvedAuthors = [...authorObjects, ...fetchedAuthors];
  if (resolvedAuthors.length === 0 && authorObj) resolvedAuthors = [authorObj];

  if (primaryAuthorId) {
    const primary = resolvedAuthors.find((u) => String(u._id || u.id) === String(primaryAuthorId)) || authorObj;
    if (primary) {
      resolvedAuthors = [
        primary,
        ...resolvedAuthors.filter((u) => String(u._id || u.id) !== String(primaryAuthorId)),
      ];
    }
  }

  let resolvedEditor = isUserObject(post.editor) ? post.editor : null;
  const editorId = !resolvedEditor && typeof post.editor === 'string' ? post.editor : '';
  if (!resolvedEditor && editorId) {
    resolvedEditor = typeof post.editorName === 'string' && post.editorName.trim()
      ? { _id: editorId, name: post.editorName }
      : await fetchPublicUser(editorId);
  }

  if (resolvedEditor && primaryAuthorId && String(resolvedEditor._id || resolvedEditor.id) === String(primaryAuthorId)) {
    resolvedEditor = null;
  }

  return {
    ...post,
    authors: resolvedAuthors,
    editor: resolvedEditor,
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slugParts = resolvedParams.slug;
  const lastSegment = slugParts[slugParts.length - 1];
  const config = await fetchWithTenant('/layout-config', { next: { revalidate: 60 } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  let metadataBase;
  try {
    const siteUrlFromConfig = String(config?.branding?.siteUrl || '').trim();
    const explicit = String(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
    const inferred = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    let base = siteUrlFromConfig || explicit || inferred;
    if (!base) {
      try {
        const h = headers();
        const host = String(h.get('x-forwarded-host') || h.get('host') || '').trim();
        const proto = String(h.get('x-forwarded-proto') || 'https').trim() || 'https';
        if (host) base = `${proto}://${host}`;
      } catch {}
    }
    const normalizedBase = (() => {
      const v = String(base || '').trim();
      if (!v) return '';
      if (v.startsWith('http://') || v.startsWith('https://')) return v;
      if (v.startsWith('//')) return `https:${v}`;
      return `https://${v}`;
    })();
    metadataBase = new URL(normalizedBase || 'http://localhost:3000');
  } catch {}

  const preservePostUrls = Boolean(config?.seo?.preservePostUrls);
  const pageUrlStructure = config?.seo?.pageUrlStructure || '/{slug}';
  const pageSlug = extractSlugFromUrl(slugParts, pageUrlStructure);
  if (pageSlug) {
    const maybePage = await getPostBySlug(pageSlug);
    if (isCustomPageType(maybePage?.type) && maybePage) {
      const siteTitle = config?.branding?.siteTitle || 'PressTag';
      const canonicalPath = preservePostUrls
        ? (buildPageUrl(maybePage, pageUrlStructure) || `/${encodeURIComponent(String(pageSlug))}`)
        : (buildPageUrlByStructure(maybePage, pageUrlStructure) || `/${encodeURIComponent(String(pageSlug))}`);
      const canonicalUrl = (() => {
        try {
          return metadataBase ? new URL(String(canonicalPath || '/'), metadataBase).toString() : String(canonicalPath || '/');
        } catch {
          return String(canonicalPath || '/');
        }
      })();
      const ogImage = resolveSiteAssetUrl(
        maybePage?.seo?.ogImage ||
        config?.seo?.defaultOgImage ||
        config?.branding?.fallbackImage ||
        config?.branding?.logo ||
        '/favicon.ico'
      );

      const title = maybePage.seo?.metaTitle || maybePage.title || siteTitle;
      const description =
        maybePage?.seo?.metaDescription ||
        maybePage?.summary ||
        (() => {
          const text = String(maybePage?.content || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (!text) return '';
          return text.length > 200 ? `${text.slice(0, 197).trim()}...` : text;
        })();

      return {
        metadataBase,
        title,
        description,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title,
          description,
          siteName: siteTitle,
          url: canonicalUrl,
          images: buildOpenGraphImage(ogImage),
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: ogImage ? [ogImage] : undefined,
        }
      };
    }
  }

  const post = await getPostBySlug(lastSegment);
  if (!post) return { title: 'Post Not Found' };

  const siteTitle = config?.branding?.siteTitle || 'PressTag';
  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  const canonicalPath = isCustomPageType(post?.type)
    ? (
        preservePostUrls
          ? (buildPageUrl(post, pageUrlStructure) || `/${encodeURIComponent(String(post.slug || post._id))}`)
          : (buildPageUrlByStructure(post, pageUrlStructure) || `/${encodeURIComponent(String(post.slug || post._id))}`)
      )
    : (
        preservePostUrls
          ? (buildPostUrl(post, urlStructure) || `/posts/${encodeURIComponent(String(post.slug || post._id))}`)
          : (buildPostUrlByStructure(post, urlStructure) || `/posts/${encodeURIComponent(String(post.slug || post._id))}`)
      );
  const canonicalUrl = (() => {
    try {
      return metadataBase ? new URL(String(canonicalPath || '/'), metadataBase).toString() : String(canonicalPath || '/');
    } catch {
      return String(canonicalPath || '/');
    }
  })();
  const ogImage = resolveSiteAssetUrl(
    post?.seo?.ogImage ||
    post?.featuredImage?.url ||
    post?.featuredImage ||
    post?.banner_image ||
    post?.coverImage ||
    config?.seo?.defaultOgImage ||
    config?.branding?.fallbackImage ||
    config?.branding?.logo ||
    '/favicon.ico'
  );

  const title = post.seo?.metaTitle || post.title;
  const description =
    post?.seo?.metaDescription ||
    post?.summary ||
    (() => {
      const text = String(post?.content || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) return '';
      return text.length > 200 ? `${text.slice(0, 197).trim()}...` : text;
    })();

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      url: canonicalUrl,
      images: buildOpenGraphImage(ogImage),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    }
  };
}

export default async function CatchAllPostPage({ params }) {
  const resolvedParams = await params;
  const slugParts = resolvedParams.slug;

  // Don't handle web-story URLs — they have their own route
  if (slugParts[0] === 'web-stories') notFound();

  const layoutConfig = await fetchWithTenant('/layout-config', { next: { revalidate: 60 } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const preservePostUrls = Boolean(layoutConfig?.seo?.preservePostUrls);
  const pageUrlStructure = layoutConfig?.seo?.pageUrlStructure || '/{slug}';
  const pageSlug = extractSlugFromUrl(slugParts, pageUrlStructure);
  if (pageSlug) {
    const maybePage = await getPostBySlug(pageSlug);
    if (isCustomPageType(maybePage?.type) && maybePage) {
      const canonicalPath = preservePostUrls
        ? buildPageUrl(maybePage, pageUrlStructure)
        : buildPageUrlByStructure(maybePage, pageUrlStructure);
      const currentPath = `/${slugParts.join('/')}`;
      if (canonicalPath && normalizePath(canonicalPath) !== normalizePath(currentPath)) {
        permanentRedirect(canonicalPath);
      }

      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                {maybePage.title}
              </h1>
              <div className="mt-6">
                <ArticleContent content={maybePage.content} />
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  const lastSegment = slugParts[slugParts.length - 1];
  let post = await getPostBySlug(lastSegment);

if (!post) {
  // Check if this was an old slug that changed — 301 redirect to new URL
  const oldPost = await getPostByPreviousSlug(lastSegment);
  if (oldPost) {
    const urlStructure = layoutConfig?.seo?.postUrlStructure || '/{category}/{slug}';
    const canonicalPath = isCustomPageType(oldPost?.type)
      ? (preservePostUrls ? buildPageUrl(oldPost, pageUrlStructure) : buildPageUrlByStructure(oldPost, pageUrlStructure))
      : (preservePostUrls ? buildPostUrl(oldPost, urlStructure) : buildPostUrlByStructure(oldPost, urlStructure));
    if (canonicalPath) redirect(canonicalPath);
  }
  notFound();
}

  if (post) post.gallery = post.gallery || post.images;
  post = await ensureCategories(post);
  post = await ensurePeople(post);
  const templateId = resolveTemplateId(layoutConfig?.branding?.templateId);
  const primaryColor = layoutConfig?.branding?.primaryColor || '#006356';
  const tagPrefix = String(layoutConfig?.seo?.tagPrefix || 'tag').trim() === 'tags' ? 'tags' : 'tag';
  const urlStructure = layoutConfig?.seo?.postUrlStructure || '/{category}/{slug}';
  const canonicalPath = isCustomPageType(post?.type)
    ? (preservePostUrls ? buildPageUrl(post, pageUrlStructure) : buildPageUrlByStructure(post, pageUrlStructure))
    : (preservePostUrls ? buildPostUrl(post, urlStructure) : buildPostUrlByStructure(post, urlStructure));
  const currentPath = `/${slugParts.join('/')}`;
  if (canonicalPath && normalizePath(canonicalPath) !== normalizePath(currentPath)) {
    permanentRedirect(canonicalPath);
  }

  if (isCustomPageType(post?.type)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              {post.title}
            </h1>
            <div className="mt-6">
              <ArticleContent content={post.content} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cleanType = post.type?.toLowerCase().trim();
  const isGallery = cleanType === 'photo gallery' || cleanType === 'photo-gallery';
  const isVideo = cleanType === 'video';
  const isWebStory = cleanType === 'web story' || cleanType === 'web-story' || cleanType === 'story';
  const isLiveBlog = cleanType === 'live blog' || cleanType === 'live-blog';

  if (isWebStory) redirect(`/web-stories/${post.slug || post._id}`);
  if (isGallery) return <GalleryClient post={post} />;
  if (isLiveBlog) return <LiveBlogViewer post={post} tagPrefix={tagPrefix} />;

  const formattedDate = formatPublishDateTime(
    post.publishDate,
    post.publishTime,
    post.publishedAt || post.createdAt
  );

  const wordsPerMinute = 200;
  const textContent = post.content?.replace(/<[^>]*>/g, '') || '';
  const wordCount = textContent.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);

  const mainImage = resolvePostImage(post) || getImageUrl(post.featuredImage) || getImageUrl(post.banner_image) || getImageUrl(post.coverImage);

  const authorsList = Array.isArray(post.authors) && post.authors.length > 0
    ? post.authors.filter(isUserObject)
    : (isUserObject(post.author) ? [post.author] : []);
  const primaryAuthor = authorsList[0] || post.author || null;
  const editorUser = isUserObject(post.editor) ? post.editor : null;
  const editorDisplayName = (editorUser?.name || (typeof post.editorName === 'string' ? post.editorName : '')).trim();
  const editorId = editorUser?._id ? String(editorUser._id) : (typeof post.editor === 'string' ? post.editor : '');
  const showEditor = !!(editorDisplayName && primaryAuthor && String(editorId) !== String(primaryAuthor._id || ''));

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = isVideo && post.videoUrl ? getYouTubeId(post.videoUrl) : null;
  const contentString = String(post?.content || '');
  const shouldLoadEmbeds = (() => {
    const s = contentString.toLowerCase();
    return (
      s.includes('twitter-tweet') ||
      s.includes('platform.twitter.com') ||
      s.includes('twitter.com') ||
      s.includes('x.com') ||
      s.includes('t.co/') ||
      s.includes('pbs.twimg.com') ||
      s.includes('instagram-media') ||
      s.includes('instagram.com') ||
      s.includes('instagr.am')
    );
  })();

  const isBoldTemplate = templateId === 'bold';
  const wrapperBg = 'bg-gray-50';
  const mainShell = isBoldTemplate
    ? 'bg-white rounded-xl shadow-sm border border-gray-100 border-t-4'
    : 'bg-white rounded-xl shadow-sm border border-gray-100';

  return (
    <div className={`min-h-screen ${wrapperBg} ${merriweather.className}`}>
      <div className="w-full pb-16 flex flex-col lg:flex-row gap-5 items-start">
        <main className={`w-full lg:w-[72%] ${mainShell} p-4 lg:p-8`} style={isBoldTemplate ? { borderTopColor: primaryColor } : undefined}>
          <header className="w-full pt-4 pb-6">

            {/* Breadcrumb */}
            <nav className="flex items-center text-xs text-gray-500 mb-4 whitespace-nowrap overflow-hidden">
              <Link href="/" className="transition-colors hover:text-[var(--primary-color)] flex-shrink-0">
                Home
              </Link>
              {post.categories?.[0] && (
                <>
                  <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
                  <Link
                    href={`/category/${post.categories[0].slug || post.categories[0].name || post.categories[0].title || ''}`}
                    className="transition-colors font-medium hover:text-[var(--primary-color)] flex-shrink-0"
                  >
                    {String(post.categories[0].name || post.categories[0].title || post.categories[0].slug || '').replace(/Ãƒâ€"/g, "").replace(/Ã—/g, "").trim()}
                  </Link>
                </>
              )}
              <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
              <span className="text-gray-400 truncate min-w-0 flex-1">{post.title}</span>
            </nav>

            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories?.slice(0, 3).map((cat, index) => (
                <Link
                  key={index}
                  href={`/category/${cat.slug || cat.name || cat.title || ''}`}
                  className="px-3 py-1 bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                  style={{ color: 'var(--primary-color)' }}
                >
                  {String(cat.name || cat.title || cat.slug || '').replace(/Ã—/g, "").replace(/×/g, "").trim()}
                </Link>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">
              {post.title}
            </h1>

            {(post.summary || post.sub_title) ? (
              <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed border-l-4 pl-4 italic" style={{ borderColor: 'var(--primary-color)' }}>
                {post.summary || post.sub_title}
              </p>
            ) : null}

            <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                  {primaryAuthor?.image || post.authorImage ? (
                    <Image
                      src={getImageUrl(primaryAuthor?.image || post.authorImage)}
                      alt={primaryAuthor?.name || post.authorName || 'Author'}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-sm">
                    {authorsList.length > 0 ? (
                      authorsList.map((a, idx) => {
                        const name = a?.name || '';
                        const slug = a?.slug || '';
                        const sep = idx === 0 ? '' : (idx === authorsList.length - 1 ? ' & ' : ', ');
                        if (slug) {
                          return (
                            <React.Fragment key={slug || idx}>
                              {sep}
                              <Link href={`/author/${slug}`} className="transition-colors hover:text-[var(--primary-color)]">
                                {name || 'Author'}
                              </Link>
                            </React.Fragment>
                          );
                        }
                        return (
                          <React.Fragment key={slug || idx}>
                            {sep}{name || 'Author'}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      post.authorName || 'SportzPoint Editor'
                    )}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formattedDate} • {readTime} min read
                    {showEditor && (
                      <>
                        {' '}• Edited by{' '}
                        {editorUser?.slug ? (
                          <Link href={`/author/${editorUser.slug}`} className="transition-colors hover:text-[var(--primary-color)]">
                            {editorDisplayName}
                          </Link>
                        ) : (
                          <span>{editorDisplayName}</span>
                        )}
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <SocialShareButtons title={post.title} />
              </div>
            </div>
          </header>

          {/* Featured Media */}
          <figure className="w-full mb-8 rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
            {videoId ? (
              <VideoPlayer videoId={videoId} posterUrl={mainImage} title={post.title} />
            ) : mainImage && (
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <Image
                  src={mainImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 72vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}
            {(post.featuredImageCaption || post.featuredImage?.caption || post.caption) && (
              <figcaption className="p-3 text-center text-sm text-gray-800 border-t border-gray-100 bg-white">
                {post.featuredImageCaption || post.featuredImage?.caption || post.caption}
              </figcaption>
            )}
          </figure>

          <AdSpot position="article_top" />

          <article className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-2 prose-headings:mt-6 prose-p:text-gray-700 prose-p:leading-loose prose-p:my-2
            prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-md
            prose-blockquote:border-l-4 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic
            prose-blockquote:bg-gray-50">
            <ArticleContent content={post.content} />
          </article>

          <AdSpot position="article_bottom" />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    href={`/${tagPrefix}/${typeof tag === 'string' ? tag.toLowerCase().replace(/\s+/g, '-') : tag.slug}`}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {typeof tag === 'string' ? tag : tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author Box */}
          {primaryAuthor && (
            <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-100 flex gap-4">
              <div className="w-16 h-16 rounded-full bg-white overflow-hidden shrink-0 border border-gray-200">
                {primaryAuthor.image ? (
                  <Image
                    src={getImageUrl(primaryAuthor.image)}
                    alt={primaryAuthor.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{primaryAuthor.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{primaryAuthor.bio || `Sports journalist and editor at SportzPoint.`}</p>
                {primaryAuthor.slug && (
                  <Link href={`/author/${primaryAuthor.slug}`} className="text-xs font-bold uppercase tracking-wider hover:underline" style={{ color: 'var(--primary-color)' }}>
                    View Profile
                  </Link>
                )}
              </div>
            </div>
          )}
        </main>

        <aside className="w-full lg:w-[28%] space-y-8 lg:sticky lg:top-0">
          <SidebarDeferredClient
            currentPostId={post?.slug || post?._id}
            categorySlug={post?.categories?.[0]?.slug}
            authorId={post?.author?._id || post?.authorId || post?.author}
            excludePostKeys={[String(post?.slug || post?._id || '')].filter(Boolean)}
          />
        </aside>
      </div>

      {shouldLoadEmbeds ? <EmbedScripts /> : null}
    </div>
  );
}
