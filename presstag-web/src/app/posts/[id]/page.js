///web> src> app> posts> [id]> page.js | website post page - handles rendering of individual posts based on ID, with special handling for different post types (article, video, gallery, web story, live blog). Also sets up metadata for SEO and social sharing. Uses Next.js 13 app directory features and server components for optimal performance.
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCategories, getPostById } from '../../../lib/api';
import { notFound, redirect } from 'next/navigation';
import { Inter, Merriweather } from 'next/font/google';
import VideoPlayer from '../../../components/VideoPlayer';
import WebStoryViewer from '../../../components/WebStoryViewer';
import LiveBlogViewer from '../../../components/LiveBlogViewer';
import GalleryClient from '../../../components/GalleryClient';
import EmbedScripts from '../../../components/EmbedScripts';
import AdSpot from '../../../components/AdSpot';
import ArticleContent from '../../../components/ArticleContent';
import SocialShareButtons from '../../../components/SocialShareButtons';
import ResponsivePostGrid from '../../../components/ResponsivePostGrid';
import { getImageUrl, resolvePostImage } from '@/lib/imageHelper';
import { buildOpenGraphImage, resolveSiteAssetUrl } from '@/lib/seo';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';
import SidebarDeferredClient from '../../../components/SidebarDeferredClient';
import { formatPublishDateTime } from '../../../util/timeFormat';
import { resolveTemplateId } from '@/lib/templates';

export const revalidate = 60;

const inter = Inter({ subsets: ['latin'] });
const merriweather = Merriweather({ 
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const [post, config] = await Promise.all([
    getPostById(resolvedParams.id),
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

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.summary,
    alternates: {
      canonical: `/posts/${encodeURIComponent(String(post.slug || post._id))}`,
    },
    openGraph: {
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.summary,
      siteName: siteTitle,
      images: buildOpenGraphImage(ogImage),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.metaTitle || post.title,
      description: post.seo?.metaDescription || post.summary,
      images: ogImage ? [ogImage] : undefined,
    }
  };
}

export default async function PostPage({ params }) {
  const resolvedParams = await params;
  let post = await getPostById(resolvedParams.id, { revalidate: 30 });
  if (post) post.gallery = post.gallery || post.images;


  const layoutConfig = await fetchWithTenant('/layout-config', { next: { revalidate: 60 } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  const templateId = resolveTemplateId(layoutConfig?.branding?.templateId);
  const tagPrefix = String(layoutConfig?.seo?.tagPrefix || 'tag').trim() === 'tags' ? 'tags' : 'tag';
  const primaryColor = layoutConfig?.branding?.primaryColor || '#006356';
  const urlStructure = layoutConfig?.seo?.postUrlStructure || '/{category}/{slug}';

  if ((!post.categories || post.categories.length === 0) && (Array.isArray(post.primary_category) ? post.primary_category.length > 0 : !!post.primary_category)) {
    const ids = Array.isArray(post.primary_category) ? post.primary_category : [post.primary_category];
    const cats = await getCategories({ cache: 'no-store' });
    const map = new Map(cats.map((c) => [String(c?._id), c]));
    const resolved = ids.map((id) => map.get(String(id))).filter(Boolean);
    if (resolved.length > 0) post = { ...post, categories: resolved };
  }

  // Determine post type
  const cleanType = post.type?.toLowerCase().trim();
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
      return <GalleryClient post={post} />;
  }

  // --- SPECIAL HANDLING FOR LIVE BLOGS ---
  if (isLiveBlog) {
      return <LiveBlogViewer post={post} />;
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
  const shouldLoadEmbeds =
    contentString.includes('twitter-tweet') ||
    contentString.includes('pbs.twimg.com') ||
    contentString.includes('instagram-media') ||
    contentString.includes('instagram.com');
  const primaryCategorySlug = post.categories?.[0]?.slug || post.categories?.[0]?.name || post.categories?.[0]?.title || '';
  const relatedPosts = await (async () => {
    if (!primaryCategorySlug) return [];
    try {
      const res = await fetchWithTenant(
        `/posts?status=published&category=${encodeURIComponent(String(primaryCategorySlug))}&limit=12&lite=1`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.posts || []);
      return list
        .filter((p) => p && String(p.slug || p._id || '') !== String(post.slug || post._id || ''))
        .slice(0, 8);
    } catch {
      return [];
    }
  })();

  const isBoldTemplate = templateId === 'bold';
  const wrapperBg = isBoldTemplate ? 'bg-slate-950' : 'bg-gray-50';
  const mainShell = isBoldTemplate
    ? 'bg-white rounded-xl shadow-sm border border-white/10'
    : 'bg-white rounded-xl shadow-sm border border-gray-100';

  return (
    <div className={`min-h-screen ${wrapperBg} ${merriweather.className}`}>
      {/* Article Header */}
      

      {/* Featured Media */}
      {/* Article Body */}
      
      {/* Main Content Layout */}
      <div className="w-full pb-16 flex flex-col lg:flex-row gap-5 items-start">
        <main className={`w-full lg:w-[72%] ${mainShell} p-4 lg:p-8`}>
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
          <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed border-l-4 pl-4 italic" style={{ borderColor: 'var(--primary-color)' }}>
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
        prose-a:no-underline hover:prose-a:underline
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

      <div className="mt-10">
        <ResponsivePostGrid
          posts={relatedPosts}
          title="Related Posts"
          sectionName="Related Posts"
          primaryColor={primaryColor}
          viewAllUrl={primaryCategorySlug ? `/category/${primaryCategorySlug}` : undefined}
          urlStructure={urlStructure}
        />
      </div>

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
