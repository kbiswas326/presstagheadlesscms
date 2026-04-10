/// web> src> components> SidebarWidget.jsx | Component that renders individual widgets in the sidebar based on the type defined in the admin panel. It supports various widget types such as Trending Posts, Recent Posts, Related Posts, Newsletter Subscription, Social Links, Ads, and Categories. The component fetches necessary data for each widget type from the backend API and displays it in a visually appealing manner. It also applies the primary branding color to widget titles and handles image URLs with a fallback mechanism for better user experience. The component is designed to be reusable and adaptable to different widget configurations defined by the admin. // --- IGNORE ---
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaLinkedin, FaTiktok, FaGlobe, FaPinterest, FaReddit, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import usePostStore from '../store/postStore';
import { buildPostUrl } from '@/lib/urlBuilder';

const resolveImageUrl = (input, fallbackImage) => {
  if (!input) return fallbackImage || '/placeholder.jpg';
  const url = typeof input === 'string' ? input : input?.url;
  if (!url) return fallbackImage || '/placeholder.jpg';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/api$/, '');
    return baseUrl + url;
  }
  return '/uploads/' + url;
};

const formatWidgetDate = (dateString, timeString) => {
  if (dateString && timeString) {
    try {
      const dateObj = new Date(dateString);
      const [hours, minutes] = timeString.split(':');
      if (!isNaN(dateObj.getTime()) && hours && minutes) {
        dateObj.setHours(parseInt(hours), parseInt(minutes));
        return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
      }
    } catch (e) { console.error(e); }
  }
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString));
};

const TrendingWidget = ({ widget, currentPostId, excludePostKeys, urlStructure, fallbackImage }) => {
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
      } catch (e) { console.error(e); }
    };
    fetchTrending();
  }, [widget.limit, currentPostId, excludePostKeys]);

  const title = widget.title || "Trending Now";

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 border-l-4 pl-2" style={{ borderColor: 'var(--primary-color)' }}>
        {title}
      </h3>
      <div className="space-y-4">
        {trendingPosts.map((story, i) => {
          const linkUrl = buildPostUrl(story, urlStructure);
          const category = story.categories && story.categories.length > 0 ? story.categories[0] : null;
          const categoryName = category ? (category.name || category.title) : '';

          return (
            <Link href={linkUrl} key={i} className="flex items-start gap-3 group relative">
              <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md z-10">
                #{i + 1}
              </div>
              <div className="relative w-24 h-20 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={resolveImageUrl(story.featuredImage || story.banner_image || story.coverImage, fallbackImage)}
                  alt={story.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {categoryName && (
                    <span className="text-[10px] font-bold uppercase truncate" style={{ color: 'var(--primary-color)' }}>
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
                  {formatWidgetDate(story.publishDate || story.publishedAt || story.createdAt, story.publishTime)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const RecentPostsWidget = ({ widget, urlStructure, fallbackImage }) => {
  const { latestStory, fetchLatestStory } = usePostStore();

  useEffect(() => {
    if (latestStory.length === 0) fetchLatestStory();
  }, [latestStory.length, fetchLatestStory]);

  const title = widget.title || "Recent Posts";

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 border-l-4 pl-2" style={{ borderColor: 'var(--primary-color)' }}>
        {title}
      </h3>
      <div className="space-y-4">
        {latestStory.slice(0, widget.limit || 5).map((story, i) => {
          const linkUrl = buildPostUrl(story, urlStructure);
          const category = story.categories && story.categories.length > 0 ? story.categories[0] : null;
          const categoryName = category ? (category.name || category.title) : '';

          return (
            <Link href={linkUrl} key={i} className="flex items-start gap-3 group">
              <div className="relative w-24 h-20 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={resolveImageUrl(story.featuredImage || story.banner_image || story.coverImage, fallbackImage)}
                  alt={story.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {categoryName && (
                    <span className="text-[10px] font-bold uppercase truncate" style={{ color: 'var(--primary-color)' }}>
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
                  {formatWidgetDate(story.publishDate || story.publishedAt || story.createdAt, story.publishTime)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const RelatedPostsWidget = ({ widget, categorySlug, currentPostId, urlStructure, fallbackImage }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!categorySlug) return;
      try {
        const { fetchWithTenant } = await import('../lib/fetchWithTenant');
        const res = await fetchWithTenant(
          `/posts?status=published&category=${encodeURIComponent(String(categorySlug))}&limit=${widget.limit || 5}&lite=1`,
          { next: { revalidate: 60 } }
        );
        if (res.ok) {
          const data = await res.json();
          const p = Array.isArray(data) ? data : (data.posts || []);
          setPosts(p.filter(item => item._id !== currentPostId && item.slug !== currentPostId).slice(0, widget.limit || 4));
        }
      } catch (e) { console.error(e); }
    };
    fetchRelated();
  }, [categorySlug, currentPostId, widget.limit]);

  if (posts.length === 0) return null;

  const title = widget.title || "Related Articles";

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 border-l-4 pl-2" style={{ borderColor: 'var(--primary-color)' }}>
        {title}
      </h3>
      <div className="space-y-4">
        {posts.map((post, i) => (
          <Link href={buildPostUrl(post, urlStructure)} key={i} className="flex items-start gap-3 group">
            <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={resolveImageUrl(post.featuredImage || post.banner_image || post.coverImage, fallbackImage)}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {post.isLive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    LIVE
                  </span>
                )}
              </div>
              <h4
                className="text-sm font-medium line-clamp-2 transition-colors mb-1"
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
              >
                {post.title}
              </h4>
              <div className="text-xs text-gray-400">
                {formatWidgetDate(post.publishDate || post.publishedAt || post.createdAt, post.publishTime)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const AuthorPostsWidget = ({ widget, authorId, currentPostId, urlStructure, fallbackImage }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchByAuthor = async () => {
      if (!authorId) return;
      try {
        const { fetchWithTenant } = await import('../lib/fetchWithTenant');
        const res = await fetchWithTenant(
          `/posts?status=published&author=${encodeURIComponent(String(authorId))}&limit=${widget.limit || 5}&lite=1`,
          { next: { revalidate: 60 } }
        );
        if (res.ok) {
          const data = await res.json();
          const p = Array.isArray(data) ? data : (data.posts || []);
          setPosts(p.filter(item => item._id !== currentPostId && item.slug !== currentPostId).slice(0, widget.limit || 4));
        }
      } catch (e) { console.error(e); }
    };
    fetchByAuthor();
  }, [authorId, currentPostId, widget.limit]);

  if (posts.length === 0) return null;

  const title = widget.title || "More from the Author";

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 border-l-4 pl-2" style={{ borderColor: 'var(--primary-color)' }}>
        {title}
      </h3>
      <div className="space-y-4">
        {posts.map((post, i) => (
          <Link href={buildPostUrl(post, urlStructure)} key={i} className="flex items-start gap-3 group">
            <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={resolveImageUrl(post.featuredImage || post.banner_image || post.coverImage, fallbackImage)}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {post.isLive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    LIVE
                  </span>
                )}
              </div>
              <h4
                className="text-sm font-medium line-clamp-2 transition-colors mb-1"
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
              >
                {post.title}
              </h4>
              <div className="text-xs text-gray-400">
                {formatWidgetDate(post.publishDate || post.publishedAt || post.createdAt, post.publishTime)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const AboutWidget = ({ widget }) => {
  const content = String(widget?.content || widget?.description || '').trim();
  if (!content) return null;
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 border-l-4 pl-2" style={{ borderColor: 'var(--primary-color)' }}>
        {widget.title || "About"}
      </h3>
      <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{content}</div>
    </div>
  );
};

const NewsletterWidget = ({ widget }) => (
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

const SocialLinksWidget = ({ widget }) => {
  const getIcon = (platform) => {
    switch (platform?.toLowerCase()) {
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
    switch (platform?.toLowerCase()) {
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

  const links = (Array.isArray(widget.socialLinks) ? widget.socialLinks : [])
    .filter((l) => l && typeof l.url === 'string' && l.url.trim() && l.url.trim() !== '#');

  if (links.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 border-l-4 pl-2" style={{ borderColor: 'var(--primary-color)' }}>
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
};

const AdsWidget = () => (
  <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center min-h-[250px] border border-gray-200">
    <span className="text-gray-400 font-medium">Advertisement</span>
  </div>
);

const CategoriesWidget = ({ widget, fallbackImage }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { fetchWithTenant } = await import('../lib/fetchWithTenant');
        const res = await fetchWithTenant('/categories', { next: { revalidate: 600 } });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || data || []);
        }
      } catch (e) { console.error(e); }
    };
    fetchCategories();
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg mb-4 border-l-4 pl-2" style={{ borderColor: 'var(--primary-color)' }}>
        {widget.title || "Categories"}
      </h3>
      <ul className="space-y-2">
        {categories.map((cat, i) => (
          <li key={i}>
            <Link
              href={`/category/${cat.slug || cat.name.toLowerCase()}`}
              className="flex justify-between items-center text-gray-700 transition-colors hover:opacity-80"
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
};

const SidebarWidget = ({ widget, currentPostId, categorySlug, authorId, primaryColor = '#ef4444', fallbackImage = null, excludePostKeys = [], urlStructure }) => {
  if (!widget?.type) return null;

  if (widget.type === 'trending') {
    return <TrendingWidget widget={widget} currentPostId={currentPostId} excludePostKeys={excludePostKeys} urlStructure={urlStructure} fallbackImage={fallbackImage} />;
  }
  if (widget.type === 'recent_posts' || widget.type === 'latest_posts' || widget.type === 'latest') {
    return <RecentPostsWidget widget={widget} urlStructure={urlStructure} fallbackImage={fallbackImage} />;
  }
  if (widget.type === 'related_posts' || widget.type === 'related') {
    return <RelatedPostsWidget widget={widget} categorySlug={categorySlug} currentPostId={currentPostId} urlStructure={urlStructure} fallbackImage={fallbackImage} />;
  }
  if (widget.type === 'author_posts' || widget.type === 'more_from_author') {
    return <AuthorPostsWidget widget={widget} authorId={authorId} currentPostId={currentPostId} urlStructure={urlStructure} fallbackImage={fallbackImage} />;
  }
  if (widget.type === 'newsletter') {
    return <NewsletterWidget widget={widget} primaryColor={primaryColor} />;
  }
  if (widget.type === 'social_links' || widget.type === 'social') {
    return <SocialLinksWidget widget={widget} primaryColor={primaryColor} />;
  }
  if (widget.type === 'ads') {
    return <AdsWidget widget={widget} />;
  }
  if (widget.type === 'about') {
    return <AboutWidget widget={widget} />;
  }
  if (widget.type === 'categories') {
    return <CategoriesWidget widget={widget} fallbackImage={fallbackImage} />;
  }
  return null;
};

export default SidebarWidget;
