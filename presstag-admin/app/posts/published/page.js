/// app/posts/published/page.js | Published Posts Management Page — server-side pagination
"use client";

import { useState, useEffect, useCallback } from "react";
import { MoreVertical, TrendingUp, Eye, Loader, BarChart3, FileText, Film, Image as ImageIcon, Smartphone, CircleDot } from "lucide-react";
import { useRouter } from 'next/navigation';
import { getEditPath } from '@/utils/getEditPath';
import { useTheme } from "../../context/ThemeContext";
import { getTenantId, posts as postsAPI } from "../../../lib/api";

const LIMIT = 20;

export default function PublishedPosts() {
  const router = useRouter();
  const { isDark } = useTheme();

  const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

  function handleEdit(post) {
    const path = getEditPath(post);
    if (path) router.push(path);
  }

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Total comes from /api/posts/stats — not from posts.length
  const [totalPublished, setTotalPublished] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [publishedTypeTotals, setPublishedTypeTotals] = useState({
    article: 0,
    video: 0,
    gallery: 0,
    webStory: 0,
    liveBlog: 0,
  });

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAuthor, setFilterAuthor] = useState("All");
  const [availableCategories, setAvailableCategories] = useState([]);

  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const publicOrigin = process.env.NEXT_PUBLIC_PUBLIC_ORIGIN || 'http://localhost:3001';

  const getCategoryNames = (categoriesArray) => {
    if (!Array.isArray(categoriesArray)) return 'Uncategorized';
    return categoriesArray
      .map(cat => {
        if (typeof cat === 'object' && cat) return cat.name || cat.title || cat.slug || '';
        return String(cat || '');
      })
      .filter(Boolean)
      .join(', ') || 'Uncategorized';
  };

  const getCategoryLabel = (post) => {
    const fromCategories = getCategoryNames(post?.categories);
    if (fromCategories !== 'Uncategorized') return fromCategories;
    const primaryIds = Array.isArray(post?.primary_category) ? post.primary_category : (post?.primary_category ? [post.primary_category] : []);
    if (primaryIds.length === 0) return 'Uncategorized';
    const map = new Map((availableCategories || []).map((c) => [String(c._id), c.name || c.slug || String(c._id)]));
    const labels = primaryIds.map((id) => map.get(String(id)) || String(id)).filter(Boolean);
    return labels.join(', ') || 'Uncategorized';
  };

  // ✅ Fetch stats once for accurate total count
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    const headers = { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() };

    // Categories
    fetch(`${BASE}/api/categories`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setAvailableCategories(data.categories || data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchTypeTotals = async () => {
      const getTotalForType = async (typeVariants) => {
        const results = await Promise.all(
          typeVariants.map(async (type) => {
            const res = await postsAPI.getByStatus('published', { page: 1, limit: 1, type });
            if (res?.error) return 0;
            return res?.pagination?.total ?? 0;
          })
        );
        return Math.max(0, ...results);
      };

      try {
        const [article, video, gallery, webStory, liveBlog] = await Promise.all([
          getTotalForType(['article']),
          getTotalForType(['video']),
          getTotalForType(['photo-gallery', 'photo gallery']),
          getTotalForType(['web-story', 'web story']),
          getTotalForType(['live-blog', 'live blog']),
        ]);

        setPublishedTypeTotals({ article, video, gallery, webStory, liveBlog });
      } catch {
        setPublishedTypeTotals({ article: 0, video: 0, gallery: 0, webStory: 0, liveBlog: 0 });
      }
    };

    fetchTypeTotals();
  }, []);

  // ✅ Fetch one page at a time from backend
  const fetchPage = useCallback(async (page) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await postsAPI.getByStatus('published', {
        page,
        limit: LIMIT,
        search,
        type: filterType,
        category: filterCategory,
      });

      if (res?.error) throw new Error(res.error);

      const fetchedPosts = res?.posts || (Array.isArray(res) ? res : []);
      setPosts(fetchedPosts);

      const total = res?.pagination?.total ?? fetchedPosts.length;
      const pages = res?.pagination?.totalPages ?? 1;
      setTotalPublished(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to fetch posts: ' + err.message);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterCategory, search]);

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCategory, filterAuthor]);

  // Client-side search and author filter on current page only
  const filtered = posts.filter(p => {
    const title = p.title || '';
    const authorLabel = (p.author && typeof p.author === 'object') ? (p.author.name || '') : (p.authorName || '');
    const authorMatch = filterAuthor === 'All' || authorLabel.toLowerCase() === filterAuthor.toLowerCase();
    const searchMatch = title.toLowerCase().includes(search.toLowerCase());
    return searchMatch && authorMatch;
  });

  const handleMenuClick = (e, key) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const topPosition = spaceBelow < menuHeight ? rect.top - menuHeight - 8 : rect.bottom + 8;
    setMenuPosition({ top: Math.max(8, topPosition), left: rect.left - 200 });
    setOpenMenuIndex(openMenuIndex === key ? null : key);
    setConfirmDeleteIndex(null);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (e.target.closest("button[data-menu-button]")) return;
      if (e.target.closest(".menu-dropdown")) return;
      setOpenMenuIndex(null);
      setConfirmDeleteIndex(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPublicUrl = (post) => {
    const t = post.type?.toLowerCase().trim();
    const s = post.slug || post._id;
    return (t === 'web story' || t === 'web-story' || t === 'story')
      ? `/web-stories/${s}`
      : `/posts/${s}`;
  };

  const getTypeBucket = (type) => {
    const t = String(type || '').toLowerCase().trim();
    if (t === 'article') return 'article';
    if (t === 'video') return 'video';
    if (t === 'photo-gallery' || t === 'photo gallery') return 'gallery';
    if (t === 'web-story' || t === 'web story' || t === 'story') return 'webStory';
    if (t === 'live-blog' || t === 'live blog') return 'liveBlog';
    return null;
  };

  const handleDelete = async (post) => {
    try {
      const token = localStorage.getItem('token') || '';
      const target = post.slug || post._id;
      const res = await fetch(`${BASE}/api/posts/${target}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() },
      });
      if (res.ok) {
        setPosts(posts.filter(p => p._id !== post._id));
        setTotalPublished(t => t - 1);
        const bucket = getTypeBucket(post.type);
        if (bucket) {
          setPublishedTypeTotals((prev) => ({ ...prev, [bucket]: Math.max(0, (prev[bucket] || 0) - 1) }));
        }
        setOpenMenuIndex(null);
        setConfirmDeleteIndex(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleUnpublish = async (post) => {
    try {
      const token = localStorage.getItem('token') || '';
      const target = post.slug || post._id;
      const res = await fetch(`${BASE}/api/posts/${target}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-tenant-id': getTenantId() },
        body: JSON.stringify({ status: 'draft' }),
      });
      if (res.ok) {
        setPosts(posts.filter(p => p._id !== post._id));
        setTotalPublished(t => t - 1);
        const bucket = getTypeBucket(post.type);
        if (bucket) {
          setPublishedTypeTotals((prev) => ({ ...prev, [bucket]: Math.max(0, (prev[bucket] || 0) - 1) }));
        }
        setOpenMenuIndex(null);
      }
    } catch (err) {
      console.error('Unpublish error:', err);
    }
  };

  const handleCopyLink = (post) => {
    navigator.clipboard.writeText(`${publicOrigin}${getPublicUrl(post)}`).catch(() => {});
  };

  const handleView = (post) => {
    window.open(`${publicOrigin}${getPublicUrl(post)}`, '_blank', 'noopener,noreferrer');
  };

  // Pagination buttons — show max 7 page numbers around current
  const getPageNumbers = () => {
    const pages = [];
    const delta = 3;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="p-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-slate-600 dark:text-gray-400 mb-8">
          <ol className="flex items-center space-x-2">
            <li><a href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">Home</a></li>
            <li className="text-slate-400">/</li>
            <li><a href="/posts" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">Posts</a></li>
            <li className="text-slate-400">/</li>
            <li className="text-slate-900 dark:text-white font-semibold">Published</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Published Posts</h1>
          </div>
          <p className="text-slate-600 dark:text-gray-400 ml-14 text-lg">
            {/* ✅ Shows real total from stats endpoint */}
            {totalPublished.toLocaleString()} total published articles
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          <StatCard label="Total Published" value={totalPublished.toLocaleString()} icon={<BarChart3 size={20} />} bgColor="bg-slate-100 dark:bg-gray-800" textColor="text-slate-700 dark:text-gray-300" iconClass="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Articles" value={publishedTypeTotals.article.toLocaleString()} icon={<FileText size={20} />} bgColor="bg-green-50 dark:bg-green-900/20" textColor="text-green-700 dark:text-green-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Videos" value={publishedTypeTotals.video.toLocaleString()} icon={<Film size={20} />} bgColor="bg-purple-50 dark:bg-purple-900/20" textColor="text-purple-700 dark:text-purple-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Galleries" value={publishedTypeTotals.gallery.toLocaleString()} icon={<ImageIcon size={20} />} bgColor="bg-blue-50 dark:bg-blue-900/20" textColor="text-blue-700 dark:text-blue-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Web Stories" value={publishedTypeTotals.webStory.toLocaleString()} icon={<Smartphone size={20} />} bgColor="bg-amber-50 dark:bg-amber-900/20" textColor="text-amber-700 dark:text-amber-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Live Blogs" value={publishedTypeTotals.liveBlog.toLocaleString()} icon={<CircleDot size={20} />} bgColor="bg-red-50 dark:bg-red-900/20" textColor="text-red-700 dark:text-red-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md ring-1 ring-white/40" />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                placeholder="Search in current page..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white">
              <option value="All">All Types</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="photo-gallery">Gallery</option>
              <option value="web-story">Web Story</option>
              <option value="live-blog">Live Blog</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white">
              <option value="All">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat._id} value={cat.slug || cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader size={32} className="animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600 dark:text-gray-400">Loading page {currentPage}...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 border-b border-slate-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Author</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Published</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">SEO</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {filtered.map((post) => (
                  <tr key={post._id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">{post.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block ${tagClass(post.type)}`}>
                        {post.type || 'Article'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-gray-300 text-sm">{getCategoryLabel(post)}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-gray-300 text-sm">{(post.author && typeof post.author === 'object' ? post.author.name : post.authorName) || 'Unknown'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-gray-400 text-sm">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${seoClass(post.seoScore || 0)}`}>
                        {post.seoScore || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button data-menu-button onClick={(e) => handleMenuClick(e, `post-${post._id}`)}
                        className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition text-slate-600 dark:text-gray-400">
                        <MoreVertical size={18} />
                      </button>
                      {openMenuIndex === `post-${post._id}` && (
                        <div className="fixed bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg z-50 w-48 overflow-hidden menu-dropdown"
                          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}>
                          <ul className="py-1">
                            <li><button onClick={() => handleEdit(post)} className="px-4 py-3 w-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left text-slate-700 dark:text-gray-300 font-medium text-sm">Edit</button></li>
                            <li><button onClick={() => handleView(post)} className="px-4 py-3 w-full hover:bg-slate-50 dark:hover:bg-gray-700/50 text-left text-slate-700 dark:text-gray-300 text-sm flex items-center gap-2"><Eye size={16} /> View</button></li>
                            <li><button onClick={() => handleCopyLink(post)} className="px-4 py-3 w-full hover:bg-slate-50 dark:hover:bg-gray-700/50 text-left text-slate-700 dark:text-gray-300 text-sm">Copy Link</button></li>
                            <li><button onClick={() => handleUnpublish(post)} className="px-4 py-3 w-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-left text-yellow-700 dark:text-yellow-400 text-sm">Unpublish</button></li>
                            <li>
                              {confirmDeleteIndex === `post-${post._id}` ? (
                                <div className="px-4 py-3">
                                  <p className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">Confirm delete?</p>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleDelete(post)} className="flex-1 bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs">Delete</button>
                                    <button onClick={() => setConfirmDeleteIndex(null)} className="flex-1 bg-slate-100 dark:bg-gray-700 px-2.5 py-1.5 rounded-lg text-xs">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeleteIndex(`post-${post._id}`)} className="px-4 py-3 w-full hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-600 dark:text-red-400 text-sm">Delete</button>
                              )}
                            </li>
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <tr><td colSpan="7" className="text-center py-12 text-slate-500 dark:text-gray-400">No posts on this page match your search</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ✅ Server-side pagination — navigates to next batch from backend */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}
              className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-gray-300 text-sm">
              «
            </button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-gray-300">
              Previous
            </button>
            {getPageNumbers().map(n => (
              <button key={n} onClick={() => setCurrentPage(n)}
                className={`px-4 py-2.5 rounded-lg font-medium transition ${
                  currentPage === n
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-50'
                }`}>
                {n}
              </button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-gray-300">
              Next
            </button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50 text-slate-700 dark:text-gray-300 text-sm">
              »
            </button>
            <span className="text-sm text-slate-500 dark:text-gray-400 ml-2">
              Page {currentPage} of {totalPages.toLocaleString()} ({totalPublished.toLocaleString()} total)
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

function tagClass(type) {
  const t = type?.toLowerCase() || '';
  if (t === "article") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (t === "live-blog") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  if (t === "video") return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
  if (t === "photo-gallery") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  if (t === "web-story") return "bg-yellow-200 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
}

function seoClass(score) {
  if (score > 80) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 60) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}

function StatCard({ label, value, icon, bgColor, textColor, iconClass }) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 border border-opacity-50 dark:border-opacity-10 shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{label}</span>
        <div className={`${iconClass}`}>{icon}</div>
      </div>
      <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
    </div>
  );
}
