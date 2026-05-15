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

  

  const imageUrl = post.image || post.featuredImage?.url || post.featuredImage || post.banner_image || post.coverImage?.url || post.coverImage;
  const finalImageSrc = getImageUrl(imageUrl);

  const cleanType = String(post?.type || '').toLowerCase().trim();
  const isWebStory =
    cleanType === 'web story' ||
    cleanType === 'web-story' ||
    cleanType === 'story';
  
  const postUrl = buildPostUrl(post, urlStructure);
  const tpl = String(variant || '').trim().toLowerCase();
  const isBold = tpl === 'bold';
  const isModern = tpl === 'modern';
  const isNews = tpl === 'news';
  const isMagazine = tpl === 'magazine';
  const isEditorial = tpl === 'editorial';
  const cat = (post?.primary_category?.[0] || post?.categories?.[0]) || null;
  const catLabel = typeof cat === 'string' ? cat : (cat?.name || cat?.title || cat?.slug || '');
  const cleanedCat = String(catLabel || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const displayCatCandidate = cleanedCat ? cleanedCat.replace(/\\b\\w/g, (ch) => ch.toUpperCase()) : '';
  const displayCat = /^[0-9a-f]{24}$/i.test(displayCatCandidate) ? '' : displayCatCandidate;
  const displayDate = post.publishedAt || post.publishDate || post.createdAt || post.updatedAt;
  const authorNames = Array.isArray(post?.authors)
    ? post.authors.map((a) => a?.name).filter(Boolean)
    : [];
  const authorLabel = authorNames.length ? authorNames.join(', ') : (post?.author?.name || '');
  const readTime = post?.content ? calculateReadTime(post.content) : '';

  const cardShell = (() => {
    if (isBold) return 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm rounded-xl';
    if (isModern) return 'bg-white hover:bg-gray-50 border-gray-100 shadow-sm hover:shadow-md rounded-2xl';
    if (isMagazine) return 'bg-white hover:bg-gray-50 border-gray-100 shadow-sm hover:shadow-md rounded-3xl';
    if (isEditorial) return 'bg-white hover:bg-gray-50 border-gray-200 shadow-none rounded-none';
    if (isNews) return 'bg-white border-b border-gray-100 hover:bg-gray-50 rounded-none';
    return 'bg-white hover:bg-gray-50 border-gray-200 rounded-lg';
  })();

  const contentPad = isNews ? 'p-4' : (isModern || isMagazine ? 'p-5' : (isEditorial ? 'p-6' : 'p-4'));

  return (
    <Link
      href={postUrl}
      className={`transition-colors border overflow-hidden cursor-pointer flex flex-col block ${cardShell}`}
    >
      {isEditorial ? (
        <div className="h-1 w-full" style={{ backgroundColor: 'var(--primary-color)' }} />
      ) : null}
      {/* Image container with fixed aspect ratio */}
      <div className="relative w-full">
        {finalImageSrc ? (
          <figure className={`relative pb-[56.25%] ${isNews || isEditorial ? '' : 'rounded'} overflow-hidden ${isEditorial ? 'border-b border-gray-200' : ''}`}>
            <Image
              src={finalImageSrc}
              alt={post.featuredImage?.altText || post.banner_desc || post.title || ""}
              fill
              sizes="(max-width: 768px) 85vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className={`object-cover object-center ${isNews || isEditorial ? '' : 'transition-transform duration-500 hover:scale-[1.02]'}`}
              
              quality={75}
            />
          </figure>
        ) : (
          <div className="relative pb-[56.25%] bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>

      <div className={`${contentPad} flex flex-col flex-grow`}>
        {(isBold || isModern || isMagazine || isEditorial) ? (
          <>
            {isEditorial ? (
              <>
                {displayCat ? (
                  <div
                    className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    {displayCat}
                  </div>
                ) : null}
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight line-clamp-2 mb-3 text-gray-950 font-[var(--font-pt-serif)]">
                  {post.isLive ? (
                    <span className="inline-flex items-center gap-1 mr-2 align-middle">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                      </span>
                      <span className="text-red-600 text-[10px] font-bold uppercase tracking-widest">LIVE</span>
                    </span>
                  ) : null}
                  {post.title}
                </h3>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-200 pt-3 text-[11px] uppercase tracking-[0.14em] text-gray-600">
                  <span className="truncate">{authorLabel || 'SportzPoint'}</span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span>{formatDate(displayDate)}</span>
                    {readTime ? (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>{readTime}</span>
                      </>
                    ) : null}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-400">
                  <span className="truncate">{authorLabel || 'SportzPoint'}</span>
                  <span className="flex-shrink-0">{formatDate(displayDate)}</span>
                </div>
                <h3 className={`${isModern || isMagazine ? 'text-base' : 'text-sm'} font-semibold line-clamp-2 mb-3 text-gray-900`}>
                  {post.isLive ? (
                    <span className="inline-flex items-center gap-1 mr-2 align-middle">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                      </span>
                      <span className="text-red-600 text-[9px] font-bold uppercase">LIVE</span>
                    </span>
                  ) : null}
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
            )}
          </>
        ) : isNews ? (
          <>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
              <span className="truncate">{displayCat || 'Latest'}</span>
              <span className="flex-shrink-0">{formatDate(displayDate)}</span>
            </div>
            <h3 className="text-base font-semibold leading-snug line-clamp-2 text-gray-900">
              {post.isLive ? (
                <span className="inline-flex items-center gap-1 mr-2 align-middle">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                  </span>
                  <span className="text-red-600 text-[9px] font-bold uppercase tracking-wider">LIVE</span>
                </span>
              ) : null}
              {post.title}
            </h3>
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold line-clamp-2 mb-2 text-gray-900">
              {post.isLive ? (
                <span className="inline-flex items-center gap-1 mr-2 align-middle">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                  </span>
                  <span className="text-red-600 text-[9px] font-bold uppercase">LIVE</span>
                </span>
              ) : null}
              {post.title}
            </h3>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-[10px] text-gray-500">
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
