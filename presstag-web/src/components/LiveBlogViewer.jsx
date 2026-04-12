"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { FaShareAlt, FaLinkedin, FaMapPin, FaSync } from 'react-icons/fa';
import { Merriweather } from 'next/font/google';
import Sidebar from './Sidebar';
import AdSpot from './AdSpot';
import SocialShareButtons from './SocialShareButtons';
import { fetchWithTenant } from '@/lib/fetchWithTenant';

const merriweather = Merriweather({ 
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

const LiveBlogViewer = ({ post }) => {
    const [livePost, setLivePost] = useState(post);
    const embedsRootRef = useRef(null);

    useEffect(() => {
        setLivePost(post);
    }, [post]);

    const { 
        title, 
        summary,
        liveUpdates = [], 
        isLive = false, 
        updatedAt,
        publishedAt,
        authorName,
        author,
        authors,
        editor,
        categories = [],
        featuredImage,
        featuredImageCaption,
        content, // Main content before updates
        tags = []
    } = livePost || {};

    const { hasTwitterEmbeds, hasInstagramEmbeds } = useMemo(() => {
        const combined = [
            typeof content === 'string' ? content : '',
            ...(Array.isArray(liveUpdates) ? liveUpdates.map((u) => (typeof u?.content === 'string' ? u.content : '')) : []),
        ].join(' ');

        const twitter = /twitter-tweet|platform\.twitter\.com|t\.co\//i.test(combined);
        const instagram = /instagram-media|www\.instagram\.com\/p\/|data-instgrm-permalink|instagram\.com\/p\//i.test(combined);
        return { hasTwitterEmbeds: twitter, hasInstagramEmbeds: instagram };
    }, [content, liveUpdates]);

    useEffect(() => {
        const root = embedsRootRef.current;
        if (!root) return;

        const processEmbeds = () => {
            try {
                if (window.twttr?.widgets?.load) window.twttr.widgets.load(root);
            } catch {}
            try {
                if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
            } catch {}
        };

        const t1 = setTimeout(processEmbeds, 0);
        const t2 = setTimeout(processEmbeds, 1000);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [updatedAt, liveUpdates?.length]);

    useEffect(() => {
        const slug = livePost?.slug;
        if (!slug) return;
        let cancelled = false;

        const tick = async () => {
            try {
                const res = await fetchWithTenant(`/posts/slug/${encodeURIComponent(String(slug))}`, { cache: 'no-store' });
                if (!res.ok) return;
                const latest = await res.json();
                if (cancelled || !latest) return;
                setLivePost((prev) => {
                    if (!prev) return latest;

                    const prevTitle = String(prev?.title || '');
                    const nextTitle = String(latest?.title || '');
                    if (prevTitle && nextTitle && prevTitle !== nextTitle) {
                        if (typeof window !== 'undefined') window.location.reload();
                        return prev;
                    }

                    const prevKey = String(prev?.updatedAt || '');
                    const nextKey = String(latest?.updatedAt || '');
                    const prevUpdatesCount = Array.isArray(prev?.liveUpdates) ? prev.liveUpdates.length : 0;
                    const nextUpdatesCount = Array.isArray(latest?.liveUpdates) ? latest.liveUpdates.length : 0;
                    if (prevKey === nextKey && prevUpdatesCount === nextUpdatesCount) return prev;

                    return {
                        ...prev,
                        isLive: !!latest?.isLive,
                        publishedAt: latest?.publishedAt || prev?.publishedAt,
                        publishDate: latest?.publishDate || prev?.publishDate,
                        publishTime: latest?.publishTime || prev?.publishTime,
                        updatedAt: latest?.updatedAt || prev?.updatedAt,
                        liveUpdates: Array.isArray(latest?.liveUpdates) ? latest.liveUpdates : [],
                    };
                });
            } catch {}
        };

        tick();
        const intervalId = setInterval(tick, 20000);
        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [livePost?.isLive, livePost?.slug]);

    const resolveImageUrl = (img) => {
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

    const formatUpdateTimestamp = useMemo(() => {
        const formatInTimeZone = (date, timeZone) => {
            try {
                return new Intl.DateTimeFormat('en-GB', {
                    timeZone,
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                }).format(date);
            } catch {
                return date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                });
            }
        };

        return (timestamp) => {
            const date = timestamp ? new Date(timestamp) : null;
            if (!date || Number.isNaN(date.getTime())) return '';
            const ist = `${formatInTimeZone(date, 'Asia/Kolkata')} IST`;
            const gmt = `${formatInTimeZone(date, 'UTC')} GMT`;
            return `${ist} • ${gmt}`;
        };
    }, []);

    // Sort updates: Pinned first, then Newest first
    const sortedUpdates = [...liveUpdates].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const authorsList = Array.isArray(authors) && authors.length > 0
      ? authors
      : (author ? [author] : []);
    const primaryAuthor = authorsList[0] || author || null;
    const safeAuthors = authorsList.filter((a) => a && typeof a === 'object' && (a._id || a.id));
    const editorUser = editor && typeof editor === 'object' ? editor : null;
    const editorDisplayName = (editorUser?.name || (typeof post?.editorName === 'string' ? post.editorName : '')).trim();
    const editorId = editorUser?._id ? String(editorUser._id) : (typeof editor === 'string' ? editor : '');
    const showEditor = !!(editorDisplayName && primaryAuthor && String(editorId) !== String(primaryAuthor?._id || ''));
    const bylineNodes = safeAuthors.length > 0
      ? safeAuthors
        .map((a) => {
          if (!a) return null;
          const name = String(a?.name || '').trim();
          if (!name) return null;
          const slug = String(a?.slug || '').trim();
          if (slug) return <Link key={String(a?._id || a?.id || slug)} href={`/author/${slug}`} className="hover:text-[var(--primary-color)] transition-colors">{name}</Link>;
          return <span key={String(a?._id || a?.id || name)}>{name}</span>;
        })
        .filter(Boolean)
      : [<span key="desk">{authorName || 'SportzPoint Desk'}</span>];

    return (
        <div className={`min-h-screen bg-gray-50 ${merriweather.className}`}>
            <div className="w-full pb-16 flex flex-col lg:flex-row gap-5 items-start">
                    <main className="w-full lg:w-[72%] bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-8" ref={embedsRootRef}>
                        {hasTwitterEmbeds && (
                            <Script
                                src="https://platform.twitter.com/widgets.js"
                                strategy="lazyOnload"
                                async
                                charSet="utf-8"
                                onLoad={() => {
                                    try {
                                        const root = embedsRootRef.current;
                                        if (window.twttr?.widgets?.load) window.twttr.widgets.load(root || undefined);
                                    } catch {}
                                }}
                            />
                        )}
                        {hasInstagramEmbeds && (
                            <Script
                                src="https://www.instagram.com/embed.js"
                                strategy="lazyOnload"
                                async
                                onLoad={() => {
                                    try {
                                        if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
                                    } catch {}
                                }}
                            />
                        )}
                        <header className="w-full pt-4 pb-6">
                            <nav className="flex items-center text-xs text-gray-500 mb-4 whitespace-nowrap overflow-hidden">
                                <Link
                                    href="/"
                                    className="transition-colors hover:text-[var(--primary-color)] flex-shrink-0"
                                    style={{ '--primary-color': 'var(--primary-color)' }}
                                >
                                    Home
                                </Link>
                                {categories?.[0] ? (
                                    <>
                                        <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
                                        <Link
                                            href={`/category/${typeof categories[0] === 'string' ? categories[0] : (categories[0]?.slug || categories[0]?.name || categories[0]?.title || '')}`}
                                            className="transition-colors font-medium hover:text-[var(--primary-color)] flex-shrink-0"
                                        >
                                            {String(typeof categories[0] === 'string' ? categories[0] : (categories[0]?.name || categories[0]?.title || categories[0]?.slug || ''))
                                                .replace(/Ãƒâ€”/g, "")
                                                .replace(/Ã—/g, "")
                                                .trim()}
                                        </Link>
                                    </>
                                ) : null}
                                <span className="mx-2 text-gray-300 flex-shrink-0">/</span>
                                <span className="text-gray-400 truncate min-w-0 flex-1">
                                    {title}
                                </span>
                            </nav>

                            <div className="flex flex-wrap gap-2 mb-4 items-center">
                                {isLive ? (
                                    <div className="flex items-center gap-2 mr-1">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                        </span>
                                        <span className="text-red-600 font-bold uppercase tracking-wider text-xs">Live Blog</span>
                                    </div>
                                ) : null}

                                {categories && categories.length > 0 ? (
                                    categories.map((cat, index) => (
                                        <Link
                                            key={index}
                                            href={`/category/${typeof cat === 'string' ? cat : (cat?.slug || cat?.name || cat?.title || '')}`}
                                            className="px-3 py-1 bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                                            style={{ color: 'var(--primary-color)' }}
                                        >
                                            {String(typeof cat === 'string' ? cat : (cat?.name || cat?.title || cat?.slug || ''))
                                                .replace(/Ãƒâ€”/g, "")
                                                .replace(/Ã—/g, "")
                                                .trim()}
                                        </Link>
                                    ))
                                ) : (
                                    <span className="px-3 py-1 bg-gray-50 text-xs font-bold uppercase tracking-wider rounded-sm" style={{ color: 'var(--primary-color)' }}>
                                        Live Blog
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
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
                                            {bylineNodes.reduce((acc, node, idx) => {
                                                if (idx === 0) return [node];
                                                return acc.concat([<span key={`sep-${idx}`}>, </span>, node]);
                                            }, [])}
                                        </span>
                                        <span className="text-xs text-gray-500" suppressHydrationWarning>
                                            {publishedAt ? new Intl.DateTimeFormat('en-US', {
                                                timeZone: 'Asia/Kolkata',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true,
                                            }).format(new Date(publishedAt)) : 'Just Now'}{showEditor ? ` • Edited by ${editorDisplayName}` : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Social Share */}
                                <SocialShareButtons title={title} />
                            </div>
                        </header>

                        {/* Featured Image - 16:9 988x556 with Caption Below */}
                        {featuredImage && resolveImageUrl(featuredImage) && (
                            <figure className="w-full mb-8 rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
                                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                                    <img
                                        src={resolveImageUrl(featuredImage)}
                                        alt={title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {(featuredImageCaption || featuredImage?.caption) && (
                                     <figcaption className="p-3 text-center text-sm text-gray-800 border-t border-gray-100 bg-white">
                                         {featuredImageCaption || featuredImage?.caption}
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
                                            const dateTimeString = formatUpdateTimestamp(update?.timestamp);

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
                    <aside className="w-full lg:w-[28%] space-y-8 lg:sticky lg:top-0">
                        <Sidebar
                            currentPostId={String(livePost?.slug || livePost?._id || '') || undefined}
                            categorySlug={(() => {
                                const first = Array.isArray(livePost?.categories) ? livePost.categories[0] : null;
                                if (!first) return undefined;
                                if (typeof first === 'string') return first;
                                return first?.slug || first?.name || first?.title || undefined;
                            })()}
                            authorId={(() => {
                                const candidate = primaryAuthor || author || null;
                                if (!candidate) return undefined;
                                if (typeof candidate === 'string') return candidate;
                                return candidate?._id || candidate?.id || undefined;
                            })()}
                            excludePostKeys={[String(livePost?.slug || livePost?._id || '')].filter(Boolean)}
                        />
                    </aside>
                </div>
        </div>
    );
};

export default LiveBlogViewer;
