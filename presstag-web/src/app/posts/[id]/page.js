///web> src> app> posts> [id]> page.js | website post page - handles rendering of individual posts based on ID, with special handling for different post types (article, video, gallery, web story, live blog). Also sets up metadata for SEO and social sharing. Uses Next.js 13 app directory features and server components for optimal performance.
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCategories } from '../../../lib/api';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import VideoPlayer from '../../../components/VideoPlayer';
import WebStoryViewer from '../../../components/WebStoryViewer';
import LiveBlogViewer from '../../../components/LiveBlogViewer';
import GalleryClient from '../../../components/GalleryClient';
import EmbedScripts from '../../../components/EmbedScripts';
import AdSpot from '../../../components/AdSpot';
import ArticleContent from '../../../components/ArticleContent';
import SocialShareButtons from '../../../components/SocialShareButtons';
import ArticleGridCard from '../../../components/ArticleGridCard';
import HorizontalCard from '../../../components/HorizontalCard';
import { getImageUrl, resolvePostImage } from '@/lib/imageHelper';
import { buildOpenGraphImage, resolveSiteAssetUrl } from '@/lib/seo';
import { buildPageUrl, buildPageUrlByStructure, buildPostUrl, buildPostUrlByStructure } from '@/lib/urlBuilder';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';
import SidebarDeferredClient from '../../../components/SidebarDeferredClient';
import { formatPublishDateTime } from '../../../util/timeFormat';
import { resolveTemplateId } from '@/lib/templates';

export const revalidate = 60;

const inter = Inter({ subsets: ['latin'], display: 'swap' });

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

async function getPostByIdOrSlug(id, options = {}) {
  const key = String(id || '').trim();
  if (!key) return null;

  try {
    const cache = options.cache || 'default';
    const revalidate = options.revalidate ?? 60;
    const fetchOptions =
      cache === 'no-store'
        ? { cache: 'no-store' }
        : { next: { revalidate } };

    const res = await fetchWithTenant(`/posts/${encodeURIComponent(key)}`, fetchOptions);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const [post, config] = await Promise.all([
    getPostByIdOrSlug(resolvedParams.id),
    (await import('@/lib/fetchWithTenant')).fetchWithTenant('/layout-config', { next: { revalidate: 60 } })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);
  if (post) post.gallery = post.gallery || post.images;
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const siteTitle = config?.branding?.siteTitle || 'PressTag';
  let metadataBase;
  try {
    const siteUrlFromConfig = String(config?.branding?.siteUrl || '').trim();
    const explicit = String(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
    const inferred = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
    let base = siteUrlFromConfig || explicit || inferred;
    if (!base) {
      try {
        const h = await headers();
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
  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  const pageUrlStructure = config?.seo?.pageUrlStructure || '/{slug}';
  const preservePostUrls = Boolean(config?.seo?.preservePostUrls);
  const cleanType = String(post?.type || '').toLowerCase().trim();
  const isCustomPage = cleanType === 'custompage' || cleanType === 'custom-page' || cleanType === 'custom page';
  const canonicalPath = isCustomPage
    ? (preservePostUrls ? buildPageUrl(post, pageUrlStructure) : buildPageUrlByStructure(post, pageUrlStructure))
    : (preservePostUrls ? buildPostUrl(post, urlStructure) : buildPostUrlByStructure(post, urlStructure))
        || `/posts/${encodeURIComponent(String(post.slug || post._id))}`;
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

export default async function PostPage({ params }) {
  const resolvedParams = await params;
  let post = await getPostByIdOrSlug(resolvedParams.id, { revalidate: 30 });
  if (post) post.gallery = post.gallery || post.images;
  if (!post) notFound();


  const layoutConfig = await fetchWithTenant('/layout-config', { next: { revalidate: 60 } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  const h = await headers();
  const templateOverride = h.get('x-template-id');
  const templateId = resolveTemplateId(templateOverride || layoutConfig?.branding?.templateId);
  const tagPrefix = String(layoutConfig?.seo?.tagPrefix || 'tag').trim() === 'tags' ? 'tags' : 'tag';
  const primaryColor = layoutConfig?.branding?.primaryColor || '#006356';
  const urlStructure = layoutConfig?.seo?.postUrlStructure || '/{category}/{slug}';
  const pageUrlStructure = layoutConfig?.seo?.pageUrlStructure || '/{slug}';
  const preservePostUrls = Boolean(layoutConfig?.seo?.preservePostUrls);

  if ((!post.categories || post.categories.length === 0) && (Array.isArray(post.primary_category) ? post.primary_category.length > 0 : !!post.primary_category)) {
    const ids = Array.isArray(post.primary_category) ? post.primary_category : [post.primary_category];
    const cats = await getCategories({ cache: 'no-store' });
    const map = new Map(cats.map((c) => [String(c?._id), c]));
    const resolved = ids.map((id) => map.get(String(id))).filter(Boolean);
    if (resolved.length > 0) post = { ...post, categories: resolved };
  }

  const resolvedType = String(post?.type || '').toLowerCase().trim();
  const isCustomPage = resolvedType === 'custompage' || resolvedType === 'custom-page' || resolvedType === 'custom page';
  const canonicalPath = isCustomPage
    ? (preservePostUrls ? buildPageUrl(post, pageUrlStructure) : buildPageUrlByStructure(post, pageUrlStructure))
    : (preservePostUrls ? buildPostUrl(post, urlStructure) : buildPostUrlByStructure(post, urlStructure));
  const currentPath = `/posts/${encodeURIComponent(String(resolvedParams.id || ''))}`;
  if (canonicalPath && normalizePath(canonicalPath) !== normalizePath(currentPath)) {
    const redirectTarget = templateOverride
      ? `${canonicalPath}${canonicalPath.includes('?') ? '&' : '?'}tpl=${encodeURIComponent(String(templateOverride))}`
      : canonicalPath;
    permanentRedirect(redirectTarget);
  }

  // Determine post type
  const cleanType = String(post?.type || '').toLowerCase().trim();
  const isGallery = cleanType === 'photo gallery' || cleanType === 'photo-gallery';
  const isVideo = cleanType === 'video';
  const isWebStory = cleanType === 'web story' || cleanType === 'web-story' || cleanType === 'story';
  const isLiveBlog = cleanType === 'live blog' || cleanType === 'live-blog';

  // --- SPECIAL HANDLING FOR WEB STORIES ---
  if (isWebStory) {
      redirect(`/web-stories/${post.slug || post._id}`);
  }

  // --- SPECIAL HANDLING FOR PHOTO GALLERIES ---
  if (isGallery) {
      return <GalleryClient post={post} templateId={templateId} tagPrefix={tagPrefix} />;
  }

  // --- SPECIAL HANDLING FOR LIVE BLOGS ---
  if (isLiveBlog) {
      return <LiveBlogViewer post={post} tagPrefix={tagPrefix} templateId={templateId} />;
  }

  // --- STANDARD ARTICLE LAYOUT ---
  const formattedDate = formatPublishDateTime(
    post.publishDate,
    post.publishTime,
    post.publishedAt || post.createdAt
  );

  const editorUser = post.editor;
  const editorDisplayName = editorUser?.name || post.editorName || '';
  const authorId = post.author?._id || post.authorId || '';
  const editorId = editorUser?._id || '';
  const authorName = post.author?.name || post.authorName || '';
  const showEditor = !!editorDisplayName && String(editorId) !== String(authorId) && String(editorDisplayName) !== String(authorName);

  // Calculate read time
  const wordsPerMinute = 200;
  const textContent = post.content?.replace(/<[^>]*>/g, '') || '';
  const wordCount = textContent.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);

  const mainImage = resolvePostImage(post) || getImageUrl(post.featuredImage) || getImageUrl(post.banner_image) || getImageUrl(post.coverImage);

  // Helper to extract YouTube ID
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
  const primaryCategorySlug = post.categories?.[0]?.slug || post.categories?.[0]?.name || post.categories?.[0]?.title || '';
  const readMorePosts = await (async () => {
    const currentKey = String(post?.slug || post?._id || '');
    const fetchList = async (url) => {
      try {
        const res = await fetchWithTenant(url, { next: { revalidate: 60 } });
        if (!res.ok) return [];
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.posts || []);
        return list.filter((p) => p && String(p.slug || p._id || '') !== currentKey);
      } catch {
        return [];
      }
    };

    const byCategory = primaryCategorySlug
      ? await fetchList(`/posts?status=published&excludeType=custompage&category=${encodeURIComponent(String(primaryCategorySlug))}&limit=12&lite=1`)
      : [];

    if (byCategory.length >= 6) return byCategory.slice(0, 6);

    const latest = await fetchList('/posts?status=published&excludeType=custompage&limit=12&lite=1');
    const merged = [...byCategory, ...latest].reduce((acc, p) => {
      const key = String(p?.slug || p?._id || '');
      if (!key) return acc;
      if (acc.seen.has(key)) return acc;
      acc.seen.add(key);
      acc.items.push(p);
      return acc;
    }, { seen: new Set(), items: [] }).items;

    return merged.slice(0, 6);
  })();

  const isBoldTemplate = templateId === 'bold';
  const wrapperBg = 'bg-gray-50';
  const mainShell = isBoldTemplate
    ? 'bg-white rounded-xl shadow-sm border border-gray-100 border-t-4'
    : 'bg-white rounded-xl shadow-sm border border-gray-100';

  if (templateId === 'modern') {
    return (
      <div className={`min-h-screen bg-white ${inter.className}`}>
        <div className="w-full pt-6 pb-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <main className="lg:col-span-8">
                <header className="mb-8">
                <nav className="flex items-center text-xs text-gray-500 mb-5 whitespace-nowrap overflow-hidden">
                  <Link href="/" className="hover:underline flex-shrink-0">
                    Home
                  </Link>
                  {post.categories?.[0] ? (
                    <>
                      <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
                      <Link
                        href={`/category/${post.categories[0].slug || post.categories[0].name || post.categories[0].title || ''}`}
                        className="font-medium hover:underline flex-shrink-0"
                      >
                        {String(post.categories[0].name || post.categories[0].title || post.categories[0].slug || '').trim()}
                      </Link>
                    </>
                  ) : null}
                </nav>

                <section className="-mx-4 lg:-mx-8 overflow-hidden rounded-3xl border border-gray-100 bg-gray-950">
                  <div className="relative px-4 lg:px-8 py-10 md:py-14">
                    {mainImage ? (
                      <>
                        <Image
                          src={mainImage}
                          alt={post.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 66vw"
                          className="object-cover object-center opacity-80"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-gray-950/20" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800" />
                    )}

                    <div className="relative max-w-3xl">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Array.isArray(post.categories) && post.categories.length > 0
                          ? post.categories.slice(0, 2).map((cat, index) => (
                              <Link
                                key={String(cat?._id || cat?.slug || index)}
                                href={`/category/${cat.slug || cat.name || cat.title || ''}`}
                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 22%, rgba(255,255,255,0.12))', color: 'white' }}
                              >
                                {String(cat.name || cat.title || cat.slug || '').trim()}
                              </Link>
                            ))
                          : null}
                        {isVideo ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white">
                            Video
                          </span>
                        ) : null}
                      </div>

                      <h1 className="modern-display text-4xl md:text-6xl tracking-tight text-white">
                        {post.title}
                      </h1>

                      {(post.summary || post.sub_title) ? (
                        <p className="modern-excerpt mt-5 text-base md:text-lg text-white/70">
                          {post.summary || post.sub_title}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>

                <div className="-mt-6 relative z-10 px-0">
                  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-4 md:px-5 md:py-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden relative shrink-0 ring-4 ring-white">
                        {post.author?.image || post.authorImage ? (
                          <Image
                            src={getImageUrl(post.author?.image || post.authorImage)}
                            alt={post.author?.name || post.authorName || 'Author'}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {post.author?.slug ? (
                            <Link href={`/author/${post.author.slug}`} className="hover:underline">
                              {post.author?.name || post.authorName || 'SportzPoint Editor'}
                            </Link>
                          ) : (
                            post.author?.name || post.authorName || 'SportzPoint Editor'
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {formattedDate} • {readTime} min read
                          {showEditor ? (
                            <>
                              {' '}• Edited by{' '}
                              {editorUser?.slug ? (
                                <Link href={`/author/${editorUser.slug}`} className="hover:underline">
                                  {editorDisplayName}
                                </Link>
                              ) : (
                                <span>{editorDisplayName}</span>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <SocialShareButtons title={post.title} />
                    </div>
                  </div>
                </div>
              </header>

              <div className="mb-8">
                {videoId ? (
                  <VideoPlayer videoId={videoId} posterUrl={mainImage} title={post.title} />
                ) : mainImage ? (
                  <div className="relative w-full overflow-hidden rounded-3xl border border-gray-100 bg-white" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={mainImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : null}

                {(post.featuredImageCaption || post.featuredImage?.caption || post.caption) ? (
                  <div className="mt-3 text-sm text-gray-600">
                    {post.featuredImageCaption || post.featuredImage?.caption || post.caption}
                  </div>
                ) : null}
              </div>

              <AdSpot position="article_top" />

              <article className="prose prose-lg md:prose-xl max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-gray-950 prose-p:text-gray-800 prose-a:underline">
                <ArticleContent content={post.content} />
              </article>

              <AdSpot position="article_bottom" />

              {post.tags && post.tags.length > 0 ? (
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, idx) => (
                      <Link
                        key={idx}
                        href={`/${tagPrefix}/${typeof tag === 'string' ? tag.toLowerCase().replace(/\s+/g, '-') : tag.slug}`}
                        className="px-3 py-1.5 rounded-full text-sm border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {typeof tag === 'string' ? tag : tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {post.author ? (
                <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-white overflow-hidden shrink-0 border border-gray-200">
                    {post.author.image ? (
                      <Image
                        src={getImageUrl(post.author.image)}
                        alt={post.author.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">{post.author.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{post.author.bio || `Sports journalist and editor at SportzPoint.`}</p>
                    {post.author.slug ? (
                      <Link href={`/author/${post.author.slug}`} className="text-xs font-semibold uppercase tracking-wider hover:underline" style={{ color: 'var(--primary-color)' }}>
                        View Profile
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}

                {readMorePosts.length > 0 ? (
                  <section className="mt-12 pt-10 border-t border-gray-100">
                    <div className="flex items-end justify-between gap-4 mb-6">
                      <h2 className="text-2xl font-bold text-gray-950">Read More</h2>
                      <div className="h-1 w-14 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {readMorePosts.map((p, i) => (
                        <ArticleGridCard key={String(p?.slug || p?._id || i)} post={p} urlStructure={urlStructure} variant="modern" />
                      ))}
                    </div>
                  </section>
                ) : null}
              </main>

              <aside className="lg:col-span-4 lg:sticky lg:top-0 space-y-8">
                <SidebarDeferredClient
                  currentPostId={post?.slug || post?._id}
                  categorySlug={post?.categories?.[0]?.slug}
                  authorId={post?.author?._id || post?.authorId || post?.author}
                  excludePostKeys={[String(post?.slug || post?._id || '')].filter(Boolean)}
                />
              </aside>
            </div>
          </div>
          {shouldLoadEmbeds ? <EmbedScripts /> : null}
        </div>
      </div>
    );
  }

  if (templateId === 'editorial') {
    return (
      <div className={`min-h-screen bg-white ${inter.className}`}>
        <div className="container mx-auto px-4 pt-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <main className="lg:col-span-8 bg-white rounded-none shadow-none border border-gray-200">
              <div className="h-1 w-full" style={{ backgroundColor: 'var(--primary-color)' }} />
              <div className="p-6 md:p-10">
              <header className="pb-8 border-b border-gray-200">
                <nav className="flex items-center text-xs text-gray-500 mb-5 whitespace-nowrap overflow-hidden">
                  <Link href="/" className="hover:underline flex-shrink-0">
                    Home
                  </Link>
                  {post.categories?.[0] ? (
                    <>
                      <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
                      <Link
                        href={`/category/${post.categories[0].slug || post.categories[0].name || post.categories[0].title || ''}`}
                        className="font-medium hover:underline flex-shrink-0"
                      >
                        {String(post.categories[0].name || post.categories[0].title || post.categories[0].slug || '').trim()}
                      </Link>
                    </>
                  ) : null}
                </nav>

                {post.categories?.[0] ? (
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--primary-color)' }}>
                    {String(post.categories[0].name || post.categories[0].title || post.categories[0].slug || '').trim()}
                  </div>
                ) : null}

                <h1 className="editorial-display text-gray-950">
                  {post.title}
                </h1>

                {(post.summary || post.sub_title) ? (
                  <p className="mt-5 editorial-excerpt text-gray-700">
                    {post.summary || post.sub_title}
                  </p>
                ) : null}

                <div className="mt-7 flex items-center justify-between gap-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-gray-700">
                    <span className="font-bold">
                      {post.author?.slug ? (
                        <Link href={`/author/${post.author.slug}`} className="hover:underline">
                          {post.author?.name || post.authorName || 'SportzPoint Editor'}
                        </Link>
                      ) : (
                        post.author?.name || post.authorName || 'SportzPoint Editor'
                      )}
                    </span>
                    <span className="text-gray-300">{' '}•{' '}</span>
                    <span className="text-gray-600">
                      {formattedDate} • {readTime} min read
                      {showEditor ? (
                        <>
                          {' '}• Edited by{' '}
                          {editorUser?.slug ? (
                            <Link href={`/author/${editorUser.slug}`} className="hover:underline">
                              {editorDisplayName}
                            </Link>
                          ) : (
                            <span>{editorDisplayName}</span>
                          )}
                        </>
                      ) : null}
                    </span>
                  </div>
                  <div className="shrink-0">
                    <SocialShareButtons title={post.title} />
                  </div>
                </div>
              </header>

              <div className="mt-8">
                {videoId ? (
                  <VideoPlayer videoId={videoId} posterUrl={mainImage} title={post.title} />
                ) : mainImage ? (
                  <figure className="w-full overflow-hidden border border-gray-200 bg-white">
                    <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                      <Image
                        src={mainImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover"
                        priority
                      />
                    </div>
                    {(post.featuredImageCaption || post.featuredImage?.caption || post.caption) ? (
                      <figcaption className="px-4 py-3 text-sm text-gray-700 border-t border-gray-200">
                        {post.featuredImageCaption || post.featuredImage?.caption || post.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ) : null}
              </div>

              <div className="mt-8">
                <AdSpot position="article_top" />
              </div>

              <article className="mt-8">
                <ArticleContent content={post.content} />
              </article>

              <div className="mt-8">
                <AdSpot position="article_bottom" />
              </div>

              {post.tags && post.tags.length > 0 ? (
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Tags</h3>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, idx) => (
                      <Link
                        key={idx}
                        href={`/${tagPrefix}/${typeof tag === 'string' ? tag.toLowerCase().replace(/\s+/g, '-') : tag.slug}`}
                        className="px-3 py-1.5 rounded-md text-sm bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {typeof tag === 'string' ? tag : tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {post.author ? (
                <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-white overflow-hidden shrink-0 border border-gray-200">
                    {post.author.image ? (
                      <Image
                        src={getImageUrl(post.author.image)}
                        alt={post.author.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">{post.author.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{post.author.bio || `Sports journalist and editor at SportzPoint.`}</p>
                    {post.author.slug ? (
                      <Link href={`/author/${post.author.slug}`} className="text-xs font-semibold uppercase tracking-wider hover:underline" style={{ color: 'var(--primary-color)' }}>
                        View Profile
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {readMorePosts.length > 0 ? (
                <section className="mt-12 pt-10 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-700">Read More</h2>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <div className="flex flex-col gap-6">
                    {readMorePosts.map((p, i) => (
                      <HorizontalCard key={String(p?.slug || p?._id || i)} post={p} urlStructure={urlStructure} variant="editorial" />
                    ))}
                  </div>
                </section>
              ) : null}

              {shouldLoadEmbeds ? <EmbedScripts /> : null}
              </div>
            </main>

            <aside className="lg:col-span-4 lg:sticky lg:top-0 space-y-8">
              <SidebarDeferredClient
                currentPostId={post?.slug || post?._id}
                categorySlug={post?.categories?.[0]?.slug}
                authorId={post?.author?._id || post?.authorId || post?.author}
                excludePostKeys={[String(post?.slug || post?._id || '')].filter(Boolean)}
              />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${wrapperBg} ${inter.className}`}>
      {/* Article Header */}
      

      {/* Featured Media */}
      {/* Article Body */}
      
      {/* Main Content Layout */}
      <div className="w-full pb-16 flex flex-col lg:flex-row gap-5 items-start">
        <main className={`w-full lg:w-[72%] ${mainShell} p-4 lg:p-8`} style={isBoldTemplate ? { borderTopColor: primaryColor } : undefined}>
<header className="w-full pt-4 pb-6">
        
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs text-gray-500 mb-4 whitespace-nowrap overflow-hidden">
        <Link 
            href="/" 
            className="transition-colors hover:text-[var(--primary-color)] flex-shrink-0"
            style={{ '--primary-color': 'var(--primary-color)' }}
        >
          Home
        </Link>
        {post.categories?.[0] && (
          <>
            <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
            <Link 
              href={`/category/${post.categories[0].slug || post.categories[0].name || post.categories[0].title || ''}`} 
              className="transition-colors font-medium hover:text-[var(--primary-color)] flex-shrink-0"
            >
              {String(post.categories[0].name || post.categories[0].title || post.categories[0].slug || '')
                .replace(/Ãƒâ€”/g, "")
                .replace(/Ã—/g, "")
                .trim()}
            </Link>
          </>
        )}
        <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
        <span className="text-gray-400 truncate min-w-0 flex-1">
          {post.title}
        </span>
      </nav>

<div className="flex flex-wrap gap-2 mb-4">
          {post.categories?.map((cat, index) => (
            <Link 
                key={index} 
                href={`/category/${cat.slug || cat.name || cat.title || ''}`} 
                className="px-3 py-1 bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                style={{ color: 'var(--primary-color)' }}
            >
              {String(cat.name || cat.title || cat.slug || '')
                .replace(/Ã—/g, "")
                .replace(/×/g, "")
                .trim()}
            </Link>
          ))}
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">
          {post.title}
        </h1>
        
        {(post.summary || post.sub_title) ? (
          <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed border-l-4 pl-4" style={{ borderColor: 'var(--primary-color)' }}>
            {post.summary || post.sub_title}
          </p>
        ) : null}

        <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
              {post.author?.image || post.authorImage ? (
                <Image
                  src={getImageUrl(post.author?.image || post.authorImage)}
                  alt={post.author?.name || post.authorName || 'Author'}
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
                {post.author?.slug ? (
                  <Link 
                    href={`/author/${post.author.slug}`} 
                    className='transition-colors hover:text-[var(--primary-color)]'
                  >
                    {post.author?.name || post.authorName || 'SportzPoint Editor'}
                  </Link>
                ) : (
                  post.author?.name || post.authorName || 'SportzPoint Editor'
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

          <SocialShareButtons title={post.title} />
        </div>
      </header>
      
      {/* Featured Media */}
      <figure className="w-full mb-8 rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
          {videoId ? (
              <VideoPlayer 
                  videoId={videoId} 
                  posterUrl={mainImage} 
                  title={post.title} 
              />
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

      {/* Ad Spot After Featured Image (Top of Article) */}
      <AdSpot position="article_top" />

      {/* Article Content */}
      <article className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-2 prose-headings:mt-6 prose-p:text-gray-700 prose-p:leading-loose prose-p:my-2
        prose-a:underline
        prose-img:rounded-xl prose-img:shadow-md
        prose-blockquote:border-l-4 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic
        prose-blockquote:bg-gray-50">
        <ArticleContent content={post.content} />
      </article>

      {/* Ad Spot After Article Content */}
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
      {post.author && (
          <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-100 flex gap-4">
               <div className="w-16 h-16 rounded-full bg-white overflow-hidden shrink-0 border border-gray-200">
                    {post.author.image ? (
                        <Image 
                            src={getImageUrl(post.author.image)} 
                            alt={post.author.name} 
                            width={64} 
                            height={64} 
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        </div>
                    )}
               </div>
               <div>
                   <h4 className="font-bold text-gray-900 mb-1">{post.author.name}</h4>
                   <p className="text-sm text-gray-600 mb-2">{post.author.bio || `Sports journalist and editor at SportzPoint.`}</p>
                   {post.author.slug && (
                       <Link href={`/author/${post.author.slug}`} className="text-xs font-bold uppercase tracking-wider hover:underline" style={{ color: 'var(--primary-color)' }}>
                           View Profile
                       </Link>
                   )}
               </div>
          </div>
      )}

      {readMorePosts.length > 0 ? (
        <section className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 pl-3" style={{ borderColor: primaryColor }}>
            Read More
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readMorePosts.map((p, i) => (
              <ArticleGridCard key={String(p?.slug || p?._id || i)} post={p} urlStructure={urlStructure} variant={templateId} />
            ))}
          </div>
        </section>
      ) : null}

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
