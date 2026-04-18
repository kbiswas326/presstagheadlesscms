// web> src> components> ArticleGridCard.jsx | Reusable grid card component for displaying post summaries in a visually appealing grid layout, with support for featured images, categories, publish date, and live status. Used in various sections of the website to showcase posts in a compact format. --- IGNORE ---
import { formatDate } from "../util/timeFormat";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { getImageUrl } from '@/lib/imageHelper';
import { buildPostUrl } from '@/lib/urlBuilder';
import { calculateReadTime } from "../util/readTime";

const ArticleGridCard = ({ post, urlStructure, variant = 'classic' }) => {
  

  if (!post) {
    return (
      <div className="text-center text-red-600 font-semibold">
        Data is missing
      </div>
    );
  }

  

const imageUrl = post.image || getImageUrl(post.featuredImage?.url || post.featuredImage || post.banner_image || post.coverImage?.url || post.coverImage);
let finalImageSrc = null;
if (imageUrl) {
  if (imageUrl.startsWith('http')) {
    finalImageSrc = imageUrl;
  } else if (imageUrl.startsWith('/uploads')) {
    finalImageSrc = `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`;
  } else {
    finalImageSrc = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${imageUrl}`;
  }
}

  const isWebStory = post.type?.toLowerCase().trim() === 'web story' || 
                     post.type?.toLowerCase().trim() === 'web-story' || 
                     post.type?.toLowerCase().trim() === 'story';
  
  const postUrl = buildPostUrl(post, urlStructure);
  const tpl = String(variant || '').trim().toLowerCase();
  const isBold = tpl === 'bold';
  const cat = (post?.primary_category?.[0] || post?.categories?.[0]) || null;
  const catLabel = typeof cat === 'string' ? cat : (cat?.name || cat?.title || cat?.slug || '');
  const cleanedCat = String(catLabel || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const displayCat = cleanedCat ? cleanedCat.replace(/\b\w/g, (ch) => ch.toUpperCase()) : '';
  const displayDate = post.publishedAt || post.publishDate || post.createdAt || post.updatedAt;
  const authorNames = Array.isArray(post?.authors)
    ? post.authors.map((a) => a?.name).filter(Boolean)
    : [];
  const authorLabel = authorNames.length ? authorNames.join(', ') : (post?.author?.name || '');
  const readTime = post?.content ? calculateReadTime(post.content) : '';

  return (
    <Link
      href={postUrl}
      className={`transition-colors border rounded-lg overflow-hidden cursor-pointer flex flex-col block ${
        isBold ? 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm rounded-xl' : 'bg-white hover:bg-gray-50 border-gray-200'
      }`}
    >
      {/* Image container with fixed aspect ratio */}
      <div className="relative w-full">
        {finalImageSrc ? (
          <figure className="relative pb-[56.25%] rounded">
            <Image
              src={finalImageSrc}
              alt={post.featuredImage?.altText || post.banner_desc || post.title || ""}
              fill
              sizes="(max-width: 768px) 85vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover object-center"
              
              quality={75}
            />
          </figure>
        ) : (
          <div className="relative pb-[56.25%] bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {isBold ? (
          <>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              <span className="truncate">{authorLabel || 'SportzPoint'}</span>
              <span className="flex-shrink-0">{formatDate(displayDate)}</span>
            </div>
            <h3 className="text-sm font-semibold line-clamp-2 mb-3 text-gray-900">
              {post.isLive && (<span className="inline-flex items-center gap-1 mr-2 align-middle"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span></span><span className="text-red-600 text-[9px] font-bold uppercase">LIVE</span></span>)}
              {post.title}
            </h3>
            <div className="mt-auto flex items-center gap-2">
              {displayCat ? (
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary-color)' }}>
                  {displayCat}
                </span>
              ) : null}
              {displayCat && readTime ? <span className="text-gray-300">•</span> : null}
              {readTime ? (
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {readTime}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <h3 className={`text-sm font-semibold line-clamp-2 mb-2 ${isBold ? 'text-gray-900' : 'text-gray-800'}`}>{post.isLive && (<span className="inline-flex items-center gap-1 mr-2 align-middle"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span></span><span className="text-red-600 text-[9px] font-bold uppercase">LIVE</span></span>)}
              {post.title}
            </h3>
            <div className="mt-auto flex items-center justify-between">
              <span className={`text-[10px] ${isBold ? 'text-gray-500' : 'text-gray-500'}`}>
                {formatDate(displayDate)}
              </span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default ArticleGridCard;
