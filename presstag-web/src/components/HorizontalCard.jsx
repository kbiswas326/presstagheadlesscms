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

  const cleanType = String(post?.type || '').toLowerCase().trim();
  const isWebStory =
    cleanType === 'web story' ||
    cleanType === 'web-story' ||
    cleanType === 'story';
  
  const postUrl = buildPostUrl(post, urlStructure);

  const imageUrl = post.image || post.featuredImage?.url || post.featuredImage || post.banner_image || post.coverImage?.url || post.coverImage;
  const finalImageSrc = resolvePostImage(post) || getImageUrl(imageUrl);

  const renderingCategories = [
    ...(post.primary_category || []),
    ...(post.categories || []),
  ];
  const uniqueRenderingCategories = renderingCategories.filter((v,i,a)=>a.findIndex(t=>(t._id === v._id))===i);

  const displayDate = post.publishedAt || post.publishDate || post.createdAt || post.updatedAt;
  const tpl = String(variant || '').trim().toLowerCase();
  const isBold = tpl === 'bold';
  const isModern = tpl === 'modern';
  const isNews = tpl === 'news';
  const isMagazine = tpl === 'magazine';
  const isEditorial = tpl === 'editorial';
  const cat = (post?.primary_category?.[0] || post?.categories?.[0]) || null;
  const catLabel = typeof cat === 'string' ? cat : (cat?.name || cat?.title || cat?.slug || '');
  const cleanedCat = String(catLabel || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const displayCatCandidate = cleanedCat ? cleanedCat.replace(/\b\w/g, (ch) => ch.toUpperCase()) : '';
  const displayCat = /^[0-9a-f]{24}$/i.test(displayCatCandidate) ? '' : displayCatCandidate;
  const authorNames = Array.isArray(post?.authors)
    ? post.authors.map((a) => a?.name).filter(Boolean)
    : [];
  const authorLabel = authorNames.length ? authorNames.join(', ') : (post?.author?.name || '');
  const shell = (() => {
    if (isBold) return 'rounded-xl p-4 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm';
    if (isModern) return 'rounded-2xl p-4 bg-white hover:bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md';
    if (isMagazine) return 'rounded-3xl p-4 bg-white hover:bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md';
    if (isEditorial) return 'rounded-none p-4 bg-white hover:bg-gray-50 border border-gray-200';
    if (isNews) return 'rounded-none p-0 bg-transparent';
    return '';
  })();

  return (
    <Link
      href={postUrl}
      className={`flex flex-row gap-4 group cursor-pointer ${shell}`}
      style={isEditorial ? { borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: 'var(--primary-color)' } : undefined}
    >
      {/* Image */}
      <div className={`relative flex-shrink-0 ${isEditorial ? 'w-2/5 md:w-2/5 lg:w-2/5' : 'w-1/3 md:w-1/3 lg:w-1/3'}`}>
        <div className={`relative pb-[56.25%] overflow-hidden ${isEditorial ? 'rounded-none border border-gray-200 bg-gray-100' : 'rounded-lg bg-gray-100'}`}>
             {finalImageSrc ? (
                <Image
                    src={finalImageSrc}
                    alt={post.featuredImage?.altText || post.title || ""}
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 33vw, 25vw"
                    className={`object-cover transition-transform duration-300 ${isEditorial ? '' : 'group-hover:scale-105'}`}
                />
             ) : (
                <div className={`absolute inset-0 ${isBold ? 'bg-gray-200' : 'bg-gray-200'}`} />
             )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow py-1">
        <div className={`flex flex-wrap gap-2 mb-1 ${isEditorial ? 'items-center' : ''}`}>
             {post.isLive && (
                     <div className="flex items-center gap-1 mr-2">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                        </span>
                        <span className={`text-red-600 ${isEditorial ? 'text-[11px] tracking-[0.14em]' : 'text-[10px] tracking-wider'} font-bold uppercase`}>LIVE</span>
                     </div>
                )}
             {(isBold || isModern || isMagazine || isNews || isEditorial) && displayCat ? (
               <span
                 className={`${isEditorial ? 'text-[11px] font-bold uppercase tracking-[0.14em]' : `text-[10px] ${isNews ? 'font-semibold tracking-wider' : 'font-bold uppercase tracking-widest'}`}`}
                 style={{ color: 'var(--primary-color)' }}
               >
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
        <h3
          className={`leading-snug mb-2 transition-colors line-clamp-2 text-gray-900 ${
            isEditorial
              ? 'text-lg md:text-xl tracking-tight group-hover:underline underline-offset-4'
              : `group-hover:text-[var(--primary-color)] ${isModern || isMagazine ? 'text-base md:text-lg font-semibold' : 'text-sm md:text-base font-bold'}`
          }`}
        >
          {post.title}
        </h3>
        <div className={`flex items-center gap-2 mt-auto ${isEditorial ? 'text-[10px] uppercase tracking-[0.14em] text-gray-600' : 'text-[11px] text-gray-500'}`}>
          <span>{formatDate(displayDate)}</span>
          {isEditorial && authorLabel ? (
            <>
              <span className="text-gray-300">•</span>
              <span className="truncate">{authorLabel}</span>
            </>
          ) : null}
          {post.content ? (
            <>
              <span className="text-gray-300">•</span>
              <span>{calculateReadTime(post.content)}</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default HorizontalCard;
