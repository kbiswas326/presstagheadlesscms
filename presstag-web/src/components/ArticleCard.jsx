"use client";

import { formatDate } from "../util/timeFormat";
import { calculateReadTime } from "../util/readTime";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { getImageUrl } from '@/lib/imageHelper';

const ArticleCard = ({ mainPost, secondaryPost }) => {
  const router = useRouter();

  if (!mainPost) return null;

  const handleClick = (post) => {
    // Handle article click
    const slug = post.slug || post._id;
    const isWebStory = post.type?.toLowerCase().trim() === 'web story' || 
                       post.type?.toLowerCase().trim() === 'web-story' || 
                       post.type?.toLowerCase().trim() === 'story';
    
    if (isWebStory) {
        router.push(`/web-stories/${slug}`);
    } else {
        router.push(`/posts/${slug}`);
    }
  };

  const ArticleContent = ({ post }) => {
    const renderingCategories = [
      ...(post.primary_category || []),
      ...(post.categories || []),
    ];
    // Simple deduplication
    const uniqueRenderingCategories = renderingCategories.filter((v,i,a)=>a.findIndex(t=>(t._id === v._id))===i);

    return (
      <div className="p-4 flex flex-col h-full">
        <div className="flex flex-wrap gap-1 mb-2">
          {post.isLive && (`r`n            <div className="text-[10px] gap-1.5 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center border border-red-100">`r`n              <span className="relative flex h-2 w-2">`r`n                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>`r`n                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>`r`n              </span>`r`n              <span>LIVE</span>`r`n            </div>`r`n          )}
          {uniqueRenderingCategories?.map(
            (c, i) =>
              c.name &&
              c.name !== "Sports" && (
                <div key={i}>
                  <span className="text-[10px] font-medium text-[#006356] bg-[#006356]/10 px-2 py-0.5 rounded">
                    {c.name || "Uncategorized"}
                  </span>
                </div>
              )
          )}
        </div>

        <h2 className="text-base font-semibold text-gray-800 line-clamp-2 mb-2">
          {post.title}
        </h2>

        <div className="mt-auto">
          <div className="flex items-center text-[10px] text-gray-500 mt-1 gap-2">
            <span className="truncate">
              {formatDate(post.published_at_datetime || post.createdAt || post.updatedAt)}
            </span>
            <span className="truncate">{calculateReadTime(post.content)}</span>
          </div>
        </div>
      </div>
    );
  };

  const ArticleBox = ({ post }) => {
    const imageUrl = getImageUrl(post.featuredImage?.url || post.featuredImage || post.banner_image);
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

    return (
    <div
      className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg overflow-hidden cursor-pointer flex flex-col h-full"
      onClick={() => handleClick(post)}
    >
      <div className="relative w-full">
        {/* 16:9 aspect ratio */}
        {finalImageSrc && (
          <figure className="relative pb-[56.25%]  rounded">
            <Image
              src={finalImageSrc}
              alt={post.featuredImage?.altText || post.banner_desc || post.title || ""}
              fill
              className="object-cover object-center"
              
              quality={75} 
            />
          </figure>
        )}
      </div>
      <ArticleContent post={post} />
    </div>
  );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ArticleBox post={mainPost} />
      {secondaryPost && <ArticleBox post={secondaryPost} />}
    </div>
  );
};

export default ArticleCard;

