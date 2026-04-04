/// app/posts/page.js - All posts with server-side pagination
"use client";

import { useState, useEffect, useCallback } from "react";
import { MoreVertical, Loader } from "lucide-react";
import { useRouter } from 'next/navigation';
import { getEditPath } from '@/utils/getEditPath';
import { useTheme } from '../context/ThemeContext';
import { getTenantId, posts as postsAPI } from "../../lib/api";

const LIMIT = 20;

export default function PostsPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Total from stats endpoint — never from posts.length
  const [totalStats, setTotalStats] = useState({ total: 0, published: 0, pending: 0, drafts: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [availableCategories, setAvailableCategories] = useState([]);

  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const getCategoryNames = (categoriesArray) => {
    if (!Array.isArray(categoriesArray)) return 'Uncategorized';
    return categoriesArray
      .map(cat => (typeof cat === 'object' && cat.name) ? cat.name : cat)
      .filter(Boolean)
      .join(', ') || 'Uncategorized';
  };

  // Fetch stats + categories once
  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    const headers = { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() };

    fetch(`${BASE}/api/categories`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAvailableCategories(data.categories || data || []); })
      .catch(() => {});

    fetch(`${BASE}/api/posts/stats`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTotalStats({
            total: data.totalArticles || 0,
            published: data.published || 0,
            pending: data.pending || 0,
            drafts: data.drafts || 0,
          });
          // Total pages based on selected status filter
          const relevantTotal = data.totalArticles || 0;
          setTotalPages(Math.ceil(relevantTotal / LIMIT));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch posts page from backend
  const fetchPage = useCallback(async (page) => {
    try {
      setIsLoading(true);
      setError(null);

      const statusParam = filterStatus === 'All' ? 'All' : filterStatus;
      const res = await postsAPI.getByStatus(statusParam, {
        page,
        limit: LIMIT,
        type: filterType,
        category: filterCategory,
      });

      if (res?.error) throw new Error(res.error);

      const fetchedPosts = Array.isArray(res) ? res : (res.posts || []);
      setPosts(fetchedPosts);

      const nextTotalPages =
        (!Array.isArray(res) && res?.pagination?.totalPages)
          ? res.pagination.totalPages
          : totalPages;
      setTotalPages(nextTotalPages);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to fetch posts: ' + err.message);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterType, filterCategory, totalStats]);

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, filterCategory]);

  // Client-side search on current page
  const filtered = posts.filter(p => {
    const title = p.title || '';
    return title.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (post) => {
    const path = getEditPath(post);
    if (path) router.push(path);
  };

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

  const handleDelete = async (post) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${BASE}/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() },
      });
      if (res.ok) {
        setPosts(posts.filter(p => p._id !== post._id));
        setOpenMenuIndex(null);
        setConfirmDeleteIndex(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const delta = 3;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-slate-600 dark:text-gray-400 mb-8">
        <ol className="flex items-center space-x-2">
          <li><a href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700">Home</a></li>
          <li className="text-slate-400">/</li>
          <li className="text-slate-900 dark:text-white font-semibold">All Posts</li>
        </ol>
      </nav>

      {/* Header with real stats */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">All Posts</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-black/5">
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Total</p>
            <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {totalStats.total.toLocaleString()}
            </span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 border border-black/5">
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Published</p>
            <span className="text-3xl font-bold text-green-700 dark:text-green-400">
              {totalStats.published.toLocaleString()}
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-black/5">
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Pending</p>
            <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">
              {totalStats.pending.toLocaleString()}
            </span>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-5 border border-black/5">
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1">Drafts</p>
            <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {totalStats.drafts.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

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
            <option value="photo gallery">Gallery</option>
            <option value="web story">Web Story</option>
            <option value="live blog">Live Blog</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white">
            <option value="All">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
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
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 border-b border-slate-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Date</th>
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
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block ${statusClass(post.status)}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300 text-sm">{getCategoryNames(post.categories)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-gray-400 text-sm">
                    {post.publishedAt || post.updatedAt || post.createdAt
                      ? new Date(post.publishedAt || post.updatedAt || post.createdAt)
                          .toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
                      : 'N/A'}
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
                          <li><button onClick={() => handleEdit(post)} className="px-4 py-3 w-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left text-slate-700 dark:text-gray-300 text-sm">Edit</button></li>
                          <li>
                            {confirmDeleteIndex === `post-${post._id}` ? (
                              <div className="px-4 py-3">
                                <p className="text-xs text-red-600 mb-2">Confirm delete?</p>
                                <div className="flex gap-2">
                                  <button onClick={() => handleDelete(post)} className="flex-1 bg-red-600 text-white px-2.5 py-1.5 rounded text-xs">Delete</button>
                                  <button onClick={() => setConfirmDeleteIndex(null)} className="flex-1 bg-gray-100 dark:bg-gray-700 px-2.5 py-1.5 rounded text-xs">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDeleteIndex(`post-${post._id}`)} className="px-4 py-3 w-full hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-600 text-sm">Delete</button>
                            )}
                          </li>
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr><td colSpan="6" className="text-center py-12 text-slate-500 dark:text-gray-400">No posts found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Server-side pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}
            className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50 text-sm">«</button>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50">Previous</button>
          {getPageNumbers().map(n => (
            <button key={n} onClick={() => setCurrentPage(n)}
              className={`px-4 py-2.5 rounded-lg font-medium transition ${
                currentPage === n ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-50'
              }`}>{n}</button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50">Next</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}
            className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50 text-sm">»</button>
          <span className="text-sm text-slate-500 dark:text-gray-400 ml-2">
            Page {currentPage} of {totalPages.toLocaleString()} ({totalStats.total.toLocaleString()} total)
          </span>
        </div>
      )}

    </div>
  );
}

function tagClass(type) {
  const t = String(type || '').toLowerCase().trim().replace(/-/g, ' ');
  if (t === "article") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (t === "live blog") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  if (t === "video") return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
  if (t === "photo gallery") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  if (t === "web story") return "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

function statusClass(status) {
  const s = status?.toLowerCase() || '';
  if (s === "published") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (s === "pending") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}
