"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { FaPlay, FaYoutube } from 'react-icons/fa';

const VideoPlayer = ({ videoId, posterUrl, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videoId) return null;

  if (isPlaying) {
    return (
      <div 
        className="relative w-full rounded-xl overflow-hidden shadow-sm bg-black"
        style={{ aspectRatio: '16/9' }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden shadow-sm bg-black cursor-pointer group"
      style={{ aspectRatio: '16/9' }}
      onClick={() => setIsPlaying(true)}
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={title || 'Video Thumbnail'}
          fill
          className="object-cover transition-opacity duration-300 group-hover:opacity-90"
          priority
        />
      ) : (
        <Image
            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title || 'Video Thumbnail'}
            fill
            className="object-cover"
        />
      )}

      {/* Dark Overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-60 group-hover:opacity-50 transition-opacity" />

      {/* Title Overlay (Top Left) */}
      {title && (
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10">
              <h3 className="text-white text-lg font-medium drop-shadow-md line-clamp-2 w-[80%]">
                  {title}
              </h3>
          </div>
      )}

      {/* YouTube-style Play Button (Center) */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="w-[68px] h-[48px] bg-[#FF0000] rounded-[12px] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-lg cursor-pointer">
          <svg height="24" viewBox="0 0 24 24" width="24" focusable="false" style={{fill: 'white'}}>
             <path d="M8 5v14l11-7z"></path>
          </svg>
        </div>
      </div>
      
      {/* Bottom Bar (Fake) */}
       <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded font-medium backdrop-blur-sm">
             Watch on YouTube
          </div>
       </div>

    </div>
  );
};

export default VideoPlayer;
