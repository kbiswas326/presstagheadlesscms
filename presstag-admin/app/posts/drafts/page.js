///admin/app/posts/drafts/page.js | Draft Posts Management Page ///
"use client";

import { useState, useEffect } from "react";
import { MoreVertical, FileText, Eye, Loader, Edit3, BarChart3, Film, Image as ImageIcon, Smartphone, CircleDot } from "lucide-react";
import { getTenantId, getUsers, posts as postsAPI } from "../../../lib/api";
import { useRouter } from 'next/navigation';
import { getEditPath } from '@/utils/getEditPath';
import { useTheme } from "../../context/ThemeContext";

export default function DraftPosts() {
  const router = useRouter();
  const { isDark } = useTheme();
  const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

  function handleEdit(post) {
    const path = getEditPath(post);
    if (path) {
      router.push(path);
    }
  }

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAuthor, setFilterAuthor] = useState("All");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableAuthors, setAvailableAuthors] = useState([]);

  const postsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDrafts, setTotalDrafts] = useState(0);

  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [publicOrigin, setPublicOrigin] = useState('');

  // =====================================================
  // HELPER: Get public URL
  // =====================================================
  const getPublicUrl = (post) => {
    const t = post.type?.toLowerCase().trim();
    const s = post.slug || post._id;
    const isWebStory = t === 'web story' || t === 'web-story' || t === 'story';
    return isWebStory ? `/web-stories/${s}` : `/posts/${s}`;
  };

  // =====================================================
  // HELPER: Get category names from array
  // =====================================================
  const getCategoryNames = (categoriesArray) => {
    if (!Array.isArray(categoriesArray)) return 'Uncategorized';
    return categoriesArray
      .map(cat => {
        if (typeof cat === 'string') {
          const found = availableCategories.find(c => c._id === cat || c.id === cat);
          return found ? found.name : cat;
        }
        return cat?.name || cat?.title || cat?.slug || 'Uncategorized';
      })
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Fetch Categories
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}`, 'x-tenant-id': getTenantId() };
        try {
          const catRes = await fetch(`${BASE}/api/categories`, { headers });
          if (catRes.ok) {
            const catData = await catRes.json();
            setAvailableCategories(catData.categories || catData || []);
          }
        } catch (catErr) {
          console.error('Failed to fetch categories:', catErr);
        }

        fetch(`${BASE}/api/layout-config`, { headers })
          .then((r) => (r.ok ? r.json() : null))
          .then((cfg) => {
            const normalizeOrigin = (raw) => String(raw || '').trim().replace(/\/+$/, '');
            const inferFromHost = () => {
              const host = window.location.hostname.toLowerCase();
              if (host.includes('localhost') || host.includes('127.0.0.1')) return 'http://localhost:3001';
              if (host.startsWith('admin.')) return `https://${host.slice(6)}`;
              if (host.startsWith('cms.')) return `https://${host.slice(4)}`;
              return '';
            };
            const fromEnv = normalizeOrigin(process.env.NEXT_PUBLIC_PUBLIC_ORIGIN);
            const fromConfig = normalizeOrigin(
              cfg?.seo?.publicOrigin ||
              cfg?.seo?.siteUrl ||
              cfg?.seo?.frontendUrl ||
              cfg?.branding?.siteUrl
            );
            setPublicOrigin(fromEnv || fromConfig || inferFromHost());
          })
          .catch(() => {});

        getUsers()
          .then((users) => {
            const rows = Array.isArray(users) ? users : (users?.users || []);
            const normalized = rows
              .map((u) => ({ _id: u?._id || u?.id, name: u?.name }))
              .filter((u) => u._id && u.name);
            setAvailableAuthors(normalized);
          })
          .catch(() => {});
      } catch (err) {
        console.error('❌ Fetch error:', err);
        setError('Failed to fetch draft posts: ' + err.message);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await postsAPI.getByStatus('draft', {
          page: currentPage,
          limit: postsPerPage,
          search,
          type: filterType,
          category: filterCategory,
        });

        if (response?.error) {
          setError(response.error);
          setPosts([]);
          setTotalPages(1);
          setTotalDrafts(0);
          return;
        }

        const fetchedPosts = response?.posts || (Array.isArray(response) ? response : []);
        setPosts(fetchedPosts);

        const total = response?.pagination?.total ?? fetchedPosts.length;
        const pages = response?.pagination?.totalPages ?? 1;
        setTotalDrafts(total);
        setTotalPages(pages);
      } catch (err) {
        console.error('❌ Fetch error:', err);
        setError('Failed to fetch draft posts: ' + err.message);
        setPosts([]);
        setTotalPages(1);
        setTotalDrafts(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [currentPage, postsPerPage, search, filterType, filterCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterCategory]);

  // Count posts by type
  const countByType = (type) => {
    const normalizeType = (t) => String(t || '').toLowerCase().replace(/-/g, ' ').trim();
    return posts.filter((p) => normalizeType(p.type) === normalizeType(type)).length;
  };

  const filtered = posts.filter((p) => {
    const title = p.title || "";
    const authorId = (p.author && typeof p.author === 'object') ? (p.author._id || p.author.id) : p.author;
    return (
      title.toLowerCase().includes(search.toLowerCase()) &&
      (filterAuthor === "All" || String(authorId || '') === String(filterAuthor))
    );
  });

  const paginated = filtered;

  const handleMenuClick = (e, key) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 200; 
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    
    let topPosition;
    if (spaceBelow < menuHeight) {
      topPosition = rect.top - menuHeight - 8;
    } else {
      topPosition = rect.bottom + 8;
    }
    
    setMenuPosition({
      top: Math.max(8, topPosition),
      left: rect.left - 200
    });
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
      await postsAPI.remove(post._id);
      setPosts(current => current.filter(p => p._id !== post._id));
      setConfirmDeleteIndex(null);
      setOpenMenuIndex(null);
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Failed to delete post: " + err.message);
    }
  };

  const handleView = (post) => {
    const path = getPublicUrl(post);
    const origin = String(publicOrigin || '').trim();
    const full = origin ? `${origin}${path}` : path;
    window.open(full, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <div className="p-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-600 dark:text-gray-400 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li><a href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition">Home</a></li>
            <li className="text-slate-400 dark:text-gray-600">/</li>
            <li><a href="/posts" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition">Posts</a></li>
            <li className="text-slate-400 dark:text-gray-600">/</li>
            <li className="text-slate-900 dark:text-white font-semibold">Drafts</li>
          </ol>
        </nav>

        {/* Header with Icon */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FileText className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Draft Posts</h1>
          </div>
          <p className="text-slate-600 dark:text-gray-400 ml-14 text-lg">Manage and edit your draft content</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          <StatCard label="Total Drafts" value={posts.length} icon={<BarChart3 size={20} />} bgColor="bg-slate-100 dark:bg-gray-800" textColor="text-slate-700 dark:text-gray-300" iconClass="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Articles" value={countByType("article")} icon={<FileText size={20} />} bgColor="bg-green-50 dark:bg-green-900/20" textColor="text-green-700 dark:text-green-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Videos" value={countByType("video")} icon={<Film size={20} />} bgColor="bg-purple-50 dark:bg-purple-900/20" textColor="text-purple-700 dark:text-purple-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Galleries" value={countByType("photo-gallery")} icon={<ImageIcon size={20} />} bgColor="bg-blue-50 dark:bg-blue-900/20" textColor="text-blue-700 dark:text-blue-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Web Stories" value={countByType("web-story")} icon={<Smartphone size={20} />} bgColor="bg-amber-50 dark:bg-amber-900/20" textColor="text-amber-700 dark:text-amber-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md ring-1 ring-white/40" />
          <StatCard label="Live Blogs" value={countByType("live-blog")} icon={<CircleDot size={20} />} bgColor="bg-red-50 dark:bg-red-900/20" textColor="text-red-700 dark:text-red-400" iconClass="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md ring-1 ring-white/40" />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 mb-8 transition-colors">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400"
                placeholder="Search draft posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium transition cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="photo gallery">Gallery</option>
              <option value="web story">Web Story</option>
              <option value="live blog">Live Blog</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium transition cursor-pointer"
            >
              <option value="All">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat._id} value={cat.slug || cat.name}>{cat.name}</option>
              ))}
            </select>

            <select
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium transition cursor-pointer"
            >
              <option value="All">All Authors</option>
              {availableAuthors.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden transition-colors">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 border-b border-slate-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Author</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Last Saved</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">SEO Score</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {paginated.map((post) => (
                <tr key={post._id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{post.title || "Untitled Draft"}</td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-block ${tagClass(post.type)}`}>
                      {post.type || 'Article'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{getCategoryLabel(post)}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{(post.author && typeof post.author === 'object' ? post.author.name : post.authorName) || 'Unknown'}</td>
                  
                  <td className="px-6 py-4 text-slate-600 dark:text-gray-400 text-sm">
                    {(() => {
                      const date = post.updatedAt || post.createdAt;
                      return date ? (
                        <div className="flex flex-col">
                          <span>
                            {new Date(date).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                            })}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-gray-500">
                            {new Date(date).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        'N/A'
                      );
                    })()}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-block ${seoClass(post.seoScore || 0)}`}>
                      {post.seoScore || 0}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      data-menu-button
                      onClick={(e) => handleMenuClick(e, `post-${post._id}`)}
                      className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                      aria-haspopup="true"
                      aria-expanded={openMenuIndex === `post-${post._id}`}
                      aria-label="Actions"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuIndex === `post-${post._id}` && (
                      <div 
                        className="fixed bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg z-50 w-48 overflow-hidden menu-dropdown"
                        style={{
                          top: `${menuPosition.top}px`,
                          left: `${menuPosition.left}px`
                        }}
                      >
                        <ul className="py-1">
                          <li>
                            <button
                              onClick={() => handleEdit(post)}
                              className="px-4 py-3 w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left text-slate-700 dark:text-gray-300 font-medium text-sm flex items-center gap-2 transition"
                            >
                              <Edit3 size={16} className="text-blue-600 dark:text-blue-400" /> Edit
                            </button>
                          </li>

                          <li>
                            {confirmDeleteIndex === `post-${post._id}` ? (
                              <div className="px-4 py-3">
                                <p className="text-xs text-red-600 dark:text-red-400 mb-2.5 font-medium">Confirm delete?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDelete(post)}
                                    className="flex-1 bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteIndex(null)}
                                    className="flex-1 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-gray-600 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteIndex(`post-${post._id}`)}
                                className="px-4 py-3 w-full hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-600 dark:text-red-400 font-medium text-sm transition"
                              >
                                Delete
                              </button>
                            )}
                          </li>

                          <li>
                            <button onClick={() => handleView(post)} className="px-4 py-3 w-full hover:bg-slate-50 dark:hover:bg-gray-700 text-left text-slate-700 dark:text-gray-300 font-medium text-sm flex items-center gap-2 transition"><Eye size={16} /> View</button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500 dark:text-gray-400">
                    {posts.length === 0 ? 'No draft posts' : 'No posts match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-medium transition"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition ${
                    currentPage === i + 1 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                      : "bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-medium transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
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

function tagClass(type) {
  const typeStr = type?.toLowerCase() || '';
  return (
    "px-3 py-1 rounded-full text-xs font-semibold " +
    (typeStr === "article"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : typeStr === "live-blog"
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      : typeStr === "video"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      : typeStr === "photo-gallery"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      : typeStr === "web-story"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300")
  );
}

function seoClass(score) {
  if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 50) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}
