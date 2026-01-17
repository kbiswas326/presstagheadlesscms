"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import { FaShareAlt, FaFacebook, FaTwitter, FaWhatsapp, FaLinkedin, FaMapPin, FaSync } from 'react-icons/fa';
import { Merriweather } from 'next/font/google';
import Sidebar from './Sidebar';
import AdSpot from './AdSpot';
import { getImageUrl } from '@/lib/imageHelper';

const merriweather = Merriweather({ 
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

const LiveBlogViewer = ({ post }) => {
    const { 
        title, 
        summary,
        liveUpdates = [], 
        isLive = false, 
        updatedAt,
        publishedAt,
        authorName,
        categories = [],
        featuredImage,
        featuredImageCaption,
        content, // Main content before updates
        tags = []
    } = post;

    useEffect(() => {
        console.log('LiveBlogViewer Post Data:', post);
        console.log('Featured Image:', featuredImage);
    }, [post, featuredImage]);

    // Helper for images
    const getImageUrl = (img) => {
        if (!img) return null;
        const url = typeof img === 'string' ? img : img?.url;
        
        if (!url || typeof url !== 'string') return null;

        if (url.startsWith('http')) {
            // Fix port compatibility: replace localhost:5000 with localhost:5001
            return url.replace('localhost:5000', 'localhost:5001');
        }
        
        // Base URL handling
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
        
        let path = url.startsWith('/') ? url : `/${url}`;
        if (!path.startsWith('/uploads/')) {
            path = `/uploads${path}`;
        }
        
        return `${baseUrl}${path}`;
    };

    // Sort updates: Pinned first, then Newest first
    const sortedUpdates = [...liveUpdates].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return (
        <article className="min-h-screen bg-white pb-20">
            <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-12">
                <div className="w-full pb-16 flex flex-col lg:flex-row gap-5 items-start">
                    <main className="w-full lg:w-[72%] bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-8">
                        {/* --- ARTICLE HEADER SECTION (Identical to PostPage) --- */}
                        <header className="w-full pt-4 pb-6">
                            {/* Categories */}
                            <div className="flex gap-2 mb-4 text-sm font-bold uppercase tracking-wider items-center">
                               {isLive && (
                                    <div className="flex items-center gap-2 mr-2">
                                         <span className="relative flex h-2 w-2">
                                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                                           <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                         </span>
                                         <span className="text-red-600 font-bold animate-pulse">LIVE Blog</span>
                                    </div>
                               )}
                               
                               {categories && categories.length > 0 ? (
                                   categories.map((cat, idx) => (
                                       <span key={idx} className="text-green-600 cursor-pointer hover:underline">
                                           {typeof cat === 'string' ? cat : cat.name || 'News'}
                                       </span>
                                   ))
                               ) : (
                                   <span className="text-green-600">Live Blog</span>
                               )}
                            </div>

                            {/* Title */}
                            <h1 className={`${merriweather.className} text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-4`}>
                                {title}
                            </h1>

                            {/* Summary */}
                            {summary && (
                                <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed border-l-4 border-green-600 pl-4 italic">
                                    {summary}
                                </p>
                            )}

                            {/* Author & Meta */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                         {/* Placeholder Avatar */}
                                         <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                             <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                         </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-sm">
                                            {authorName || 'SportzPoint Desk'}
                                        </span>
                                        <span className="text-xs text-gray-500" suppressHydrationWarning>
                                            {publishedAt ? new Date(publishedAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'Just Now'}
                                        </span>
                                    </div>
                                </div>

                                {/* Social Share */}
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 font-medium text-sm hidden sm:block">Share On:</span>
                                    <FaFacebook className="text-blue-600 hover:text-blue-700 cursor-pointer transition" size={20} />
                                    <FaTwitter className="text-sky-500 hover:text-sky-600 cursor-pointer transition" size={20} />
                                    <FaWhatsapp className="text-green-500 hover:text-green-600 cursor-pointer transition" size={20} />
                                </div>
                            </div>
                        </header>

                        {/* Featured Image - 16:9 988x556 with Caption Below */}
                        {featuredImage && getImageUrl(featuredImage) && (
                            <figure className="w-full mb-8 rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
                                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                                    <img
                                        src={getImageUrl(featuredImage)}
                                        alt={title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {(featuredImageCaption || featuredImage?.caption || summary) && (
                                     <figcaption className="p-3 text-center text-sm text-gray-800 border-t border-gray-100 bg-white">
                                         {featuredImageCaption || featuredImage?.caption || summary}
                                     </figcaption>
                                )}
                            </figure>
                        )}

                        <div className="flex flex-col gap-12">
                             {/* Main Body */}
                             <div className="flex-1 min-w-0">
                                
                                {/* 1. Main Content (Before Updates) */}
                                {content && (
                                    <div 
                                        className={`prose prose-lg prose-green max-w-none ${merriweather.className} prose-headings:font-sans prose-headings:text-gray-900 prose-img:rounded-xl prose-a:text-green-600 mb-12`}
                                        dangerouslySetInnerHTML={{ __html: content.replace(/http:\/\/localhost:5000/g, 'http://localhost:5001') }}
                                    />
                                )}

                                {/* 2. Live Updates Section */}
                                <div className={`pt-8 mt-8 ${isLive ? 'border-t-2 border-green-600' : 'border-t-4 border-gray-900'}`}>
                                    <AdSpot position="article_top" />
                                    {/* Live Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            {isLive ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="relative flex h-3 w-3">
                                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                                    </span>
                                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                                        Live Updates
                                                    </h2>
                                                </div>
                                            ) : (
                                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                                    Updates
                                                </h2>
                                            )}
                                        </div>
                                        
                                        {isLive && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full animate-pulse">
                                                <FaSync className="animate-spin" />
                                                <span>LIVE</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Updates List */}
                                    <div className="space-y-8">
                                        {sortedUpdates.map((update, idx) => {
                                            const updateTime = new Date(update.timestamp);
                                            const dateTimeString = updateTime.toLocaleString([], { 
                                                month: 'short', 
                                                day: 'numeric', 
                                                year: 'numeric', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            });

                                            return (
                                                <React.Fragment key={idx}>
                                                    {idx === 3 && <AdSpot position="article_middle" />}
                                                    <div className={`relative bg-white rounded-lg shadow-sm border-l-4 p-6 hover:shadow-md transition-shadow ${update.pinned ? 'border-blue-600 bg-blue-50/30' : 'border-teal-700'}`}>
                                                        
                                                        {/* Pinned Badge */}
                                                        {update.pinned && (
                                                            <div className="absolute top-4 right-4 text-blue-600">
                                                                <FaMapPin size={18} />
                                                            </div>
                                                        )}

                                                        {/* Timestamp */}
                                                        <div className="text-sm text-gray-500 italic mb-3 flex items-center gap-2" suppressHydrationWarning>
                                                            {dateTimeString}
                                                            {update.pinned && <span className="text-xs font-bold text-blue-600 uppercase bg-blue-100 px-2 py-0.5 rounded">Pinned</span>}
                                                        </div>

                                                        {/* Update Title */}
                                                        {update.title && (
                                                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                                                {update.title}
                                                            </h3>
                                                        )}

                                                        {/* Update Body */}
                                                        <div 
                                                            className={`prose max-w-none text-gray-700 leading-relaxed ${merriweather.className} prose-headings:text-gray-900 prose-green prose-a:text-green-600`}
                                                            dangerouslySetInnerHTML={{ __html: update.content?.replace(/http:\/\/localhost:5000/g, 'http://localhost:5001') || '' }}
                                                        />
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}

                                        <AdSpot position="article_bottom" />

                                        {sortedUpdates.length === 0 && (
                                            <div className="text-center text-gray-500 italic py-10 bg-gray-50 rounded-lg">
                                                No updates yet. Stay tuned!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tags (Bottom) */}
                                {tags && tags.length > 0 && (
                                    <div className="mt-12 pt-8 border-t border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Tags :</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition cursor-pointer">
                                                    #{typeof tag === 'string' ? tag : tag.name || 'Tag'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    </main>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-[28%] space-y-8">
                        <Sidebar />
                    </aside>
                </div>
            </div>
        </article>
    );
};

export default LiveBlogViewer;