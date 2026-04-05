/// web>src>components>FeaturedHero.jsx | used for featured hero section ///
"use client";

import { formatDate } from "../util/timeFormat";
import { calculateReadTime } from "../util/readTime";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { getImageUrl } from '@/lib/imageHelper';
import { buildPostUrl } from '@/lib/urlBuilder';

const FeaturedHero = ({ post, urlStructure }) => {

  if (!post) return null;
  console.log('hero image:', post.image, 'featuredImage:', post.featuredImage);
  const postUrl = buildPostUrl(post, urlStructure);

// Use pre-resolved image from page.js, or fall back to deriving it
const imageUrl = post.image || getImageUrl(post.featuredImage?.url || post.featuredImage || post.banner_image);
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
    ...(post.categories || []),
    ...(post.primary_category || []),
  ];
  const formatCategoryLabel = (value) => {
    const raw = typeof value === 'string'
      ? value
      : (value?.name || value?.title || value?.slug || '');

    if (!raw) return '';

    const cleaned = String(raw).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    return cleaned.replace(/\b\w/g, (ch) => ch.toUpperCase());
  };

  const isMongoIdString = (value) => /^[a-f0-9]{24}$/i.test(String(value || '').trim());

  const uniqueRenderingCategories = renderingCategories
    .map((c) => {
      const key = typeof c === 'string' ? String(c) : String(c?._id || c?.slug || c?.name || c?.title || '');
      if (typeof c === 'string' && isMongoIdString(key)) return null;
      const label = formatCategoryLabel(c);
      if (!key || !label) return null;
      if (isMongoIdString(label)) return null;
      return { key, label };
    })
    .filter(Boolean)
    .reduce((acc, curr) => {
      const existing = acc.get(curr.key);
      if (!existing) acc.set(curr.key, curr);
      else if (isMongoIdString(existing.label) && !isMongoIdString(curr.label)) acc.set(curr.key, curr);
      return acc;
    }, new Map());

  const heroCategories = Array.from(uniqueRenderingCategories.values());

  const displayDate = post.publishedAt || post.publishDate || post.createdAt || post.updatedAt;

  return (
    <Link
      href={postUrl}
      className="relative block w-full h-[400px] md:h-[500px] group cursor-pointer rounded-2xl overflow-hidden shadow-sm"
    >
        {/* Image Background */}
        {finalImageSrc ? (
            <Image
                src={finalImageSrc}
                alt={post.featuredImage?.altText || post.title || ""}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
            />
        ) : (
            <div className="absolute inset-0 bg-gray-800" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-3">
                {post.isLive && (
                        <div className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 mr-2">
                             <span className="relative flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                             </span>
                             LIVE
                        </div>
                    )}
                {heroCategories.slice(0, 1).map((cat) => (
                    <span 
                        key={cat.key} 
                        className="px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-sm"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                        {cat.label}
                    </span>
                ))}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3 drop-shadow-sm transition-colors hover:opacity-90">
                {post.title}
            </h1>

            <div className="flex items-center text-xs md:text-sm text-gray-300 gap-3">
                <span className="font-medium text-white">{post.author?.name || "SportzPoint"}</span>
                
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

export default FeaturedHero;
