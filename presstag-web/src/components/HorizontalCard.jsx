// web> src> components> HorizontalCard.jsx | Reusable horizontal card component for displaying post summaries in a compact format, with support for featured images, categories, publish date, and read time. Used in various sections of the website to showcase posts in a visually appealing way. --- IGNORE ---
import { formatDate } from "../util/timeFormat";
import { calculateReadTime } from "../util/readTime";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { getImageUrl, resolvePostImage } from '@/lib/imageHelper';
import { buildPostUrl } from '@/lib/urlBuilder';

const HorizontalCard = ({ post, urlStructure, variant = 'classic' }) => {

  if (!post) return null;

  const isWebStory = post.type?.toLowerCase().trim() === 'web story' || 
                     post.type?.toLowerCase().trim() === 'web-story' || 
                     post.type?.toLowerCase().trim() === 'story';
  
  const postUrl = buildPostUrl(post, urlStructure);

const imageUrl = post.image || resolvePostImage(post) || getImageUrl(post.featuredImage?.url || post.featuredImage || post.banner_image || post.coverImage?.url || post.coverImage);
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

  const renderingCategories = [
    ...(post.primary_category || []),
    ...(post.categories || []),
  ];
  const uniqueRenderingCategories = renderingCategories.filter((v,i,a)=>a.findIndex(t=>(t._id === v._id))===i);

  const displayDate = post.publishedAt || post.publishDate || post.createdAt || post.updatedAt;
  const tpl = String(variant || '').trim().toLowerCase();
  const isBold = tpl === 'bold';
  const cat = (post?.primary_category?.[0] || post?.categories?.[0]) || null;
  const catLabel = typeof cat === 'string' ? cat : (cat?.name || cat?.title || cat?.slug || '');
  const cleanedCat = String(catLabel || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const displayCatCandidate = cleanedCat ? cleanedCat.replace(/\b\w/g, (ch) => ch.toUpperCase()) : '';
  const displayCat = /^[0-9a-f]{24}$/i.test(displayCatCandidate) ? '' : displayCatCandidate;

  return (
    <Link
      href={postUrl}
      className={`flex flex-row gap-4 group cursor-pointer ${
        isBold ? 'rounded-xl p-3 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm' : ''
      }`}
    >
      {/* Image */}
      <div className="relative w-1/3 md:w-1/3 lg:w-1/3 flex-shrink-0">
        <div className={`relative pb-[56.25%] rounded-lg overflow-hidden ${isBold ? 'bg-gray-100' : 'bg-gray-100'}`}>
             {finalImageSrc ? (
                <Image
                    src={finalImageSrc}
                    alt={post.featuredImage?.altText || post.title || ""}
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
             ) : (
                <div className={`absolute inset-0 ${isBold ? 'bg-gray-200' : 'bg-gray-200'}`} />
             )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow py-1">
        <div className="flex flex-wrap gap-2 mb-1">
             {post.isLive && (
                     <div className="flex items-center gap-1 mr-2">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                        </span>
                        <span className="text-red-600 text-[10px] font-bold uppercase tracking-wider">LIVE</span>
                     </div>
                )}
             {isBold && displayCat ? (
                 <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary-color)' }}>
                     {displayCat}
                 </span>
             ) : (
               uniqueRenderingCategories.slice(0, 1).map((cat, i) => (
                   <span 
                      key={i} 
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--primary-color)' }}
                   >
                       {cat.name}
                   </span>
               ))
             )}
        </div>
        <h3 className={`text-sm md:text-base font-bold leading-snug mb-1 transition-colors line-clamp-2 group-hover:text-[var(--primary-color)] ${isBold ? 'text-gray-900' : 'text-gray-900'}`}>
          {post.title}
        </h3>
        <div className={`flex items-center text-[11px] gap-2 mt-auto ${isBold ? 'text-gray-500' : 'text-gray-500'}`}>
            <span>{formatDate(displayDate)}</span>
            {post.content && (
                <>
                    
                    <span>{calculateReadTime(post.content)}</span>
                </>
            )}
        </div>
      </div>
    </Link>
  );
};

export default HorizontalCard;
