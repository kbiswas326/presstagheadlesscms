///website post page - handles rendering of individual posts based on ID, with special handling for different post types (article, video, gallery, web story, live blog). Also sets up metadata for SEO and social sharing. Uses Next.js 13 app directory features and server components for optimal performance.
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPostById } from '../../../lib/api';
import { notFound, redirect } from 'next/navigation';
import { FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { Inter, Merriweather } from 'next/font/google';
import VideoPlayer from '../../../components/VideoPlayer';
import WebStoryViewer from '../../../components/WebStoryViewer';
import LiveBlogViewer from '../../../components/LiveBlogViewer';
import GalleryClient from '../../../components/GalleryClient';
import EmbedScripts from '../../../components/EmbedScripts';
import Sidebar from '../../../components/Sidebar';
import AdSpot from '../../../components/AdSpot';
import ArticleContent from '../../../components/ArticleContent';
import { getImageUrl } from '@/lib/imageHelper';

const inter = Inter({ subsets: ['latin'] });
const merriweather = Merriweather({ 
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const post = await getPostById(resolvedParams.id);
  if (post) post.gallery = post.gallery || post.images;
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.summary,
  };
}

export default async function PostPage({ params }) {
  const resolvedParams = await params;
  // Don't cache post pages - always fetch fresh to get latest publish time
  const post = await getPostById(resolvedParams.id, { cache: 'no-store' });
  if (post) post.gallery = post.gallery || post.images;

  if (!post) {
    notFound();
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
  const formattedDate = (() => {
    if (post.publishDate && post.publishTime) {
      try {
        // Handle YYYY-MM-DD
        const dateObj = new Date(post.publishDate);
        // Handle HH:MM
        const [hours, minutes] = post.publishTime.split(':');
        
        if (!isNaN(dateObj.getTime()) && hours && minutes) {
            dateObj.setHours(parseInt(hours), parseInt(minutes));
            return dateObj.toLocaleString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
        }
      } catch (e) {
        console.error('Date parsing error', e);
      }
    }
    
    return new Date(post.publishedAt || post.createdAt).toLocaleString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  })();

  // Calculate read time
  const wordsPerMinute = 200;
  const textContent = post.content?.replace(/<[^>]*>/g, '') || '';
  const wordCount = textContent.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);

  const mainImage = getImageUrl(post.featuredImage) || getImageUrl(post.banner_image) || getImageUrl(post.coverImage);

  // Helper to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = isVideo && post.videoUrl ? getYouTubeId(post.videoUrl) : null;

  return (
    <div className={`min-h-screen bg-gray-50 ${merriweather.className}`}>
      {/* Article Header */}
      

      {/* Featured Media */}
      {/* Article Body */}
      
      {/* Main Content Layout */}
      <div className="w-full pb-16 flex flex-col lg:flex-row gap-5 items-start">
        <main className="w-full lg:w-[72%] bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-8">
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
              href={`/category/${post.categories[0].slug}`} 
              className="transition-colors font-medium hover:text-[var(--primary-color)] flex-shrink-0"
            >
              {post.categories[0].name?.replace(/Ãƒâ€”/g, "").replace(/Ã—/g, "").trim()}
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
                href={`/category/${cat.slug}`} 
                className="px-3 py-1 bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                style={{ color: 'var(--primary-color)' }}
            >
              {cat.name?.replace(/Ã—/g, "").replace(/×/g, "").trim()}
            </Link>
          ))}
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>
        
        <h2 className="text-lg md:text-xl text-gray-600 leading-relaxed mb-6 font-light">
          {post.summary || post.sub_title}
        </h2>

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
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium text-sm hidden sm:block">Share On:</span>
            <FaFacebook className="text-blue-600 hover:text-blue-700 cursor-pointer transition" size={20} />
            <FaTwitter className="text-sky-500 hover:text-sky-600 cursor-pointer transition" size={20} />
            <FaWhatsapp className="text-green-500 hover:text-green-600 cursor-pointer transition" size={20} />
          </div>
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
                  <img
                      src={mainImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                  />
              </div>
          )}
          
          {(post.featuredImageCaption || post.featuredImage?.caption || post.caption || post.summary || post.excerpt) && (
              <figcaption className="p-3 text-center text-sm text-gray-800 border-t border-gray-100 bg-white">
                  {post.featuredImageCaption || post.featuredImage?.caption || post.caption || post.summary || post.excerpt}
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
                        href={`/tag/${typeof tag === 'string' ? tag.toLowerCase().replace(/\s+/g, '-') : tag.slug}`}
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

        </main>

        <aside className="w-full lg:w-[28%] space-y-8 lg:sticky lg:top-0">
            <Sidebar />
        </aside>
      </div>

      <EmbedScripts />
    </div>
  );
}
