/// web> src> components> SidebarWidget.jsx | Component that renders individual widgets in the sidebar based on the type defined in the admin panel. It supports various widget types such as Trending Posts, Recent Posts, Related Posts, Newsletter Subscription, Social Links, Ads, and Categories. The component fetches necessary data for each widget type from the backend API and displays it in a visually appealing manner. It also applies the primary branding color to widget titles and handles image URLs with a fallback mechanism for better user experience. The component is designed to be reusable and adaptable to different widget configurations defined by the admin. // --- IGNORE ---
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaLinkedin, FaTiktok, FaGlobe, FaPinterest, FaReddit, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import usePostStore from '../store/postStore';
import { getImageUrl } from '@/lib/imageHelper';

const SidebarWidget = ({ widget, currentPostId, categorySlug, primaryColor = '#ef4444', fallbackImage = null, excludePostKeys = [] }) => {
    
    const getImageUrl = (input) => {
        if (!input) return fallbackImage || '/placeholder.jpg';
        const url = typeof input === 'string' ? input : input?.url;
        if (!url) return fallbackImage || '/placeholder.jpg';
        if (url.startsWith('http')) {
            return url;
        }
        if (url.startsWith('/uploads')) {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/api$/, '');
            return baseUrl + url;
        }
        return '/uploads/' + url;
    };

    const formatDate = (dateString, timeString) => {
        if (dateString && timeString) {
            try {
                const dateObj = new Date(dateString);
                const [hours, minutes] = timeString.split(':');
                if (!isNaN(dateObj.getTime()) && hours && minutes) {
                    dateObj.setHours(parseInt(hours), parseInt(minutes));
                    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                }
            } catch (e) { console.error(e); }
        }
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // --- Trending Posts (Sorted by Views) ---
    if (widget.type === 'trending') {
        const [trendingPosts, setTrendingPosts] = useState([]);

        useEffect(() => {
            const fetchTrending = async () => {
                try {
                    const desiredCount = Math.max(5, widget.limit || 5);
                    const excluded = new Set(
                      [currentPostId, ...(Array.isArray(excludePostKeys) ? excludePostKeys : [])]
                        .filter(Boolean)
                        .map((v) => String(v))
                    );

                    const appendUnique = (out, seen, items) => {
                      for (const p of items) {
                        if (!p) continue;
                        const title = String(p.title || '').trim();
                        if (!title) continue;
                        const key = String(p.slug || p._id || '');
                        if (!key) continue;
                        if (excluded.has(key)) continue;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        out.push(p);
                        if (out.length >= desiredCount) break;
                      }
                    };

                    const { fetchWithTenant } = await import('../lib/fetchWithTenant');

                    const isHomeSidebar = !currentPostId && excluded.size > 0;
                    const out = [];
                    const seen = new Set();

                    if (isHomeSidebar) {
                      const recentRes = await fetchWithTenant(
                        `/posts?status=published&limit=${desiredCount * 10}`,
                        { cache: 'no-store' }
                      );
                      if (recentRes.ok) {
                        const recentData = await recentRes.json();
                        const recentItems = Array.isArray(recentData) ? recentData : (recentData.posts || []);
                        appendUnique(out, seen, recentItems);
                        if (out.length >= desiredCount) {
                          setTrendingPosts(out);
                          return;
                        }
                      }
                    }

                    const res = await fetchWithTenant(
                      `/posts?sort=trending&status=published&limit=${desiredCount * 3}`,
                      { cache: 'no-store' }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const items = Array.isArray(data) ? data : (data.posts || []);
                        appendUnique(out, seen, items);
                        if (out.length >= desiredCount) {
                          setTrendingPosts(out);
                          return;
                        }
                    }

                    const fallbackRes = await fetchWithTenant(
                      `/posts?status=published&limit=${desiredCount * 10}`,
                      { cache: 'no-store' }
                    );
                    if (fallbackRes.ok) {
                      const fallbackData = await fallbackRes.json();
                      const fallbackItems = Array.isArray(fallbackData) ? fallbackData : (fallbackData.posts || []);
                      appendUnique(out, seen, fallbackItems);
                      setTrendingPosts(out);
                    }
                } catch(e) { console.error(e); }
            };
            fetchTrending();
        }, [widget.limit, currentPostId, excludePostKeys]);

        const title = widget.title || "Trending Now";

        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 
                    className="font-bold text-lg mb-4 border-l-4 pl-2"
                    style={{ borderColor: 'var(--primary-color)' }}
                >
                    {title}
                </h3>
                <div className="space-y-4">
                    {trendingPosts.map((story, i) => {
                         const isWebStory = story.type?.toLowerCase().trim() === 'web story' || 
                                            story.type?.toLowerCase().trim() === 'web-story' || 
                                            story.type?.toLowerCase().trim() === 'story';
                         const linkUrl = isWebStory ? '/web-stories/' + (story.slug || story._id) : '/posts/' + (story.slug || story._id);
                         const category = story.categories && story.categories.length > 0 ? story.categories[0] : null;
                         const categoryName = category ? (category.name || category.title) : '';
                         
                         return (
                            <Link href={linkUrl} key={i} className="flex items-start gap-3 group relative">
                                <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md z-10">
                                    #{i + 1}
                                </div>
                                <div className="relative w-24 h-20 flex-shrink-0 overflow-hidden rounded-md">
                                    <Image 
                                        src={getImageUrl(story.featuredImage || story.banner_image || story.coverImage)} 
                                        alt={story.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {categoryName && (
                                            <span 
                                                className="text-[10px] font-bold uppercase truncate"
                                                style={{ color: 'var(--primary-color)' }}
                                            >
                                                {categoryName}
                                            </span>
                                        )}
                                        {story.isLive && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                    <h4 
                                        className="text-sm font-medium line-clamp-2 transition-colors mb-1 leading-snug"
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                                    >
                                        {story.title}
                                    </h4>
                                    <div className="text-xs text-gray-400">
                                        {formatDate(story.publishDate || story.publishedAt || story.createdAt, story.publishTime)}
                                    </div>
                                </div>
                            </Link>
                         );
                    })}
                </div>
            </div>
        );
    }

    // --- Recent Posts (Default Store) ---
    if (widget.type === 'recent_posts') {
        const { latestStory, fetchLatestStory } = usePostStore();
        
        useEffect(() => {
            if (latestStory.length === 0) fetchLatestStory();
        }, [latestStory.length, fetchLatestStory]);

        const title = widget.title || "Recent Posts";

        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 
                    className="font-bold text-lg mb-4 border-l-4 pl-2"
                    style={{ borderColor: 'var(--primary-color)' }}
                >
                    {title}
                </h3>
                <div className="space-y-4">
                    {latestStory.slice(0, widget.limit || 5).map((story, i) => {
                         const isWebStory = story.type?.toLowerCase().trim() === 'web story' || 
                                            story.type?.toLowerCase().trim() === 'web-story' || 
                                            story.type?.toLowerCase().trim() === 'story';
                         const linkUrl = isWebStory ? '/web-stories/' + (story.slug || story._id) : '/posts/' + (story.slug || story._id);
                         const category = story.categories && story.categories.length > 0 ? story.categories[0] : null;
                         const categoryName = category ? (category.name || category.title) : '';
                         
                         return (
                            <Link href={linkUrl} key={i} className="flex items-start gap-3 group">
                                <div className="relative w-24 h-20 flex-shrink-0 overflow-hidden rounded-md">
                                    <Image 
                                        src={getImageUrl(story.featuredImage || story.banner_image || story.coverImage)} 
                                        alt={story.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {categoryName && (
                                            <span 
                                                className="text-[10px] font-bold uppercase truncate"
                                                style={{ color: 'var(--primary-color)' }}
                                            >
                                                {categoryName}
                                            </span>
                                        )}
                                        {story.isLive && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                    <h4 
                                        className="text-sm font-medium line-clamp-2 transition-colors mb-1 leading-snug"
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                                    >
                                        {story.title}
                                    </h4>
                                    <div className="text-xs text-gray-400">
                                        {formatDate(story.publishDate || story.publishedAt || story.createdAt, story.publishTime)}
                                    </div>
                                </div>
                            </Link>
                         );
                    })}
                </div>
            </div>
        );
    }

    // --- Related Posts ---
    if (widget.type === 'related_posts' || widget.type === 'related') {
        const [posts, setPosts] = useState([]);

        useEffect(() => {
            const fetchRelated = async () => {
                if (!categorySlug) return;
                try {
                    const { fetchWithTenant } = await import('../lib/fetchWithTenant');
                    const res = await fetchWithTenant(
                      `/posts?status=published&category=${categorySlug}&limit=${widget.limit || 5}`,
                      { cache: 'no-store' }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        let p = Array.isArray(data) ? data : (data.posts || []);
                        setPosts(p.filter(item => item._id !== currentPostId && item.slug !== currentPostId).slice(0, widget.limit || 4));
                    }
                } catch(e) { console.error(e); }
            };
            fetchRelated();
        }, [categorySlug, currentPostId, widget.limit]);

        if (posts.length === 0) return null;

        const title = widget.title || "Related Articles";

        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 
                    className="font-bold text-lg mb-4 border-l-4 pl-2"
                    style={{ borderColor: 'var(--primary-color)' }}
                >
                    {title}
                </h3>
                <div className="space-y-4">
                    {posts.map((post, i) => (
                         <Link href={'/posts/' + (post.slug || post._id)} key={i} className="flex items-start gap-3 group">
                            <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden rounded-md">
                                <Image 
                                    src={getImageUrl(post.featuredImage || post.banner_image || post.coverImage)} 
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <h4 
                                className="text-sm font-medium line-clamp-2 transition-colors"
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                            >
                                {post.title}
                            </h4>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }
    
    // --- Newsletter ---
    if (widget.type === 'newsletter') {
        return (
            <div className="bg-gray-50 p-6 rounded-lg text-center border border-gray-100">
                <h3 className="font-bold text-lg mb-2">{widget.title || "Subscribe"}</h3>
                <p className="text-gray-600 text-sm mb-4">Get the latest news directly to your inbox</p>
                <div className="flex flex-col gap-2">
                    <input 
                        type="email" 
                        placeholder="Your email address" 
                        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-1"
                        style={{ '--tw-ring-color': 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                    />
                    <button 
                        className="text-white px-4 py-2 rounded-md transition-colors font-medium"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                        Subscribe
                    </button>
                </div>
            </div>
        );
    }

    // --- Social Links ---
    if (widget.type === 'social_links' || widget.type === 'social') {
        const getIcon = (platform) => {
            switch(platform?.toLowerCase()) {
                case 'facebook': return <FaFacebook size={24} />;
                case 'twitter': return <FaTwitter size={24} />;
                case 'instagram': return <FaInstagram size={24} />;
                case 'youtube': return <FaYoutube size={24} />;
                case 'linkedin': return <FaLinkedin size={24} />;
                case 'tiktok': return <FaTiktok size={24} />;
                case 'pinterest': return <FaPinterest size={24} />;
                case 'reddit': return <FaReddit size={24} />;
                case 'whatsapp': return <FaWhatsapp size={24} />;
                case 'telegram': return <FaTelegram size={24} />;
                default: return <FaGlobe size={24} />;
            }
        };

        const getColorClass = (platform) => {
             switch(platform?.toLowerCase()) {
                case 'facebook': return 'text-blue-600';
                case 'twitter': return 'text-sky-500';
                case 'instagram': return 'text-pink-600';
                case 'youtube': return 'text-red-600';
                case 'linkedin': return 'text-blue-700';
                case 'pinterest': return 'text-red-700';
                case 'reddit': return 'text-orange-600';
                case 'whatsapp': return 'text-green-500';
                case 'telegram': return 'text-sky-500';
                default: return 'text-gray-600';
            }
        };

        const links = widget.socialLinks && widget.socialLinks.length > 0 ? widget.socialLinks : [
            { platform: 'facebook', url: '#' },
            { platform: 'twitter', url: '#' },
            { platform: 'instagram', url: '#' },
            { platform: 'youtube', url: '#' }
        ];

        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 
                    className="font-bold text-lg mb-4 border-l-4 pl-2"
                    style={{ borderColor: 'var(--primary-color)' }}
                >
                    {widget.title || "Follow Us"}
                </h3>
                <div className="flex gap-4 flex-wrap">
                    {links.map((link, i) => (
                        <a 
                            key={i} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`${getColorClass(link.platform)} hover:opacity-80 transition-opacity`}
                            title={link.platform}
                        >
                            {getIcon(link.platform)}
                        </a>
                    ))}
                </div>
            </div>
        );
    }

    // --- Ads ---
    if (widget.type === 'ads') {
        return (
             <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center min-h-[250px] border border-gray-200">
                <span className="text-gray-400 font-medium">Advertisement</span>
            </div>
        );
    }

    // --- Categories ---
    if (widget.type === 'categories') {
        const [categories, setCategories] = useState([]);

        useEffect(() => {
            const fetchCategories = async () => {
                try {
                    const { fetchWithTenant } = await import('../lib/fetchWithTenant');
                    const res = await fetchWithTenant('/categories', { cache: 'no-store' });
                    if (res.ok) {
                        const data = await res.json();
                        setCategories(data.categories || data || []);
                    }
                } catch(e) { console.error(e); }
            };
            fetchCategories();
        }, []);

        return (
             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 
                    className="font-bold text-lg mb-4 border-l-4 pl-2"
                    style={{ borderColor: 'var(--primary-color)' }}
                >
                    {widget.title || "Categories"}
                </h3>
                <ul className="space-y-2">
                    {categories.map((cat, i) => (
                         <li key={i}>
                            <Link 
                                href={`/category/${cat.slug || cat.name.toLowerCase()}`} 
                                className="flex justify-between items-center text-gray-700 transition-colors hover:opacity-80"
                                style={{ ':hover': { color: 'var(--primary-color)' } }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                            >
                                <span>{cat.name}</span>
                                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{cat.count || 0}</span>
                            </Link>
                         </li>
                    ))}
                    {categories.length === 0 && (
                        <li className="text-gray-500 text-sm">No categories found.</li>
                    )}
                </ul>
            </div>
        );
    }

    return null;
};

export default SidebarWidget;
