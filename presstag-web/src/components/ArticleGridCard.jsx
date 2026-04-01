// web> src> components> ArticleGridCard.jsx | Reusable grid card component for displaying post summaries in a visually appealing grid layout, with support for featured images, categories, publish date, and live status. Used in various sections of the website to showcase posts in a compact format. --- IGNORE ---
"use client";

import { formatDate } from "../util/timeFormat";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { getImageUrl } from '@/lib/imageHelper';
import { buildPostUrl } from '@/lib/urlBuilder';

const ArticleGridCard = ({ post, urlStructure }) => {
  

  if (!post) {
    return (
      <div className="text-center text-red-600 font-semibold">
        Data is missing
      </div>
    );
  }

  

const imageUrl = post.image || getImageUrl(post.featuredImage?.url || post.featuredImage || post.banner_image || post.coverImage?.url || post.coverImage);  if (imageUrl) {
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

  return (
    <Link
      href={postUrl}
      className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg overflow-hidden cursor-pointer flex flex-col block"
    >
      {/* Image container with fixed aspect ratio */}
      <div className="relative w-full">
        {finalImageSrc ? (
          <figure className="relative pb-[56.25%] rounded">
            <Image
              src={finalImageSrc}
              alt={post.featuredImage?.altText || post.banner_desc || post.title || ""}
              fill
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
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2">{post.isLive && (<span className="inline-flex items-center gap-1 mr-2 align-middle"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span></span><span className="text-red-600 text-[9px] font-bold uppercase">LIVE</span></span>)}
          {post.title}
        </h3>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] text-gray-500">
            {formatDate(post.publishedAt || post.publishDate || post.createdAt || post.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ArticleGridCard;

