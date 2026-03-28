"use client";

import { useState, useEffect } from "react";
import { MoreVertical, TrendingUp, Eye, Loader } from "lucide-react";
import { posts as postsAPI } from "../../lib/api";
import { useRouter } from 'next/navigation';
import { getEditPath } from '@/utils/getEditPath';
import { useTheme } from "../context/ThemeContext";

export default function DashboardPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  function handleEdit(post) {
    const path = getEditPath(post);
    if (path) {
      router.push(path);
    }
  }

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ published: 0, pending: 0, drafts: 0 });
  
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [availableCategories, setAvailableCategories] = useState([]);

  const postsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

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
        return cat.name || 'Uncategorized';
      })
      .join(', ') || 'Uncategorized';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Fetch Categories
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
          const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers });
          if (catRes.ok) {
            const catData = await catRes.json();
            setAvailableCategories(catData.categories || catData || []);
          }
        } catch (catErr) {
          console.error('Failed to fetch categories:', catErr);
        }

        // 2. Fetch All Posts (Published, Pending, Draft)
        const [pub, pen, dr] = await Promise.all([
          postsAPI.getByStatus('published'),
          postsAPI.getByStatus('pending'),
          postsAPI.getByStatus('draft')
        ]);

        const publishedPosts = Array.isArray(pub) ? pub : (pub.posts || []);
        const pendingPosts = Array.isArray(pen) ? pen : (pen.posts || []);
        const draftPosts = Array.isArray(dr) ? dr : (dr.posts || []);

        setStats({
          published: publishedPosts.length,
          pending: pendingPosts.length,
          drafts: draftPosts.length
        });
        
        // Combine all posts and sort by latest date
        const allPosts = [...publishedPosts, ...pendingPosts, ...draftPosts].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.publishedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.publishedAt || b.createdAt || 0);
          return dateB - dateA;
        });

        setPosts(allPosts);
      } catch (err) {
        console.error('❌ Fetch error:', err);
        setError('Failed to fetch dashboard data: ' + err.message);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Count posts by type
  const countByType = (type) => posts.filter((p) => p.type?.toLowerCase() === type.toLowerCase()).length;

  const filtered = posts.filter((p) => {
    const categoryNames = getCategoryNames(p.categories);
    const title = p.title || "";
    return (
      title.toLowerCase().includes(search.toLowerCase()) &&
      (filterType === "All" || p.type?.toLowerCase() === filterType.toLowerCase()) &&
      (filterStatus === "All" || p.status?.toLowerCase() === filterStatus.toLowerCase()) &&
      (filterCategory === "All" || categoryNames.toLowerCase().includes(filterCategory.toLowerCase()))
    );
  });

  const totalPages = Math.ceil(filtered.length / postsPerPage);
  const paginated = filtered.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filtered, totalPages]);

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

  const handleDelete = async (postId) => {
    try {
      const response = await postsAPI.delete(postId);
      if (!response.error) {
        setPosts(posts.filter(p => p._id !== postId));
        setOpenMenuIndex(null);
        setConfirmDeleteIndex(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
            <li className="text-slate-900 dark:text-white font-semibold">Dashboard</li>
          </ol>
        </nav>

        {/* Header with Icon */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          </div>
          <p className="text-slate-600 dark:text-gray-400 ml-14 text-lg">Overview of all your content and performance</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Posts" value={posts.length} icon="📝" bgColor="bg-slate-100 dark:bg-gray-800" textColor="text-slate-700 dark:text-gray-300" />
          <StatCard label="Published" value={stats.published} icon="✅" bgColor="bg-green-50 dark:bg-green-900/20" textColor="text-green-700 dark:text-green-400" />
          <StatCard label="Pending" value={stats.pending} icon="⏳" bgColor="bg-yellow-50 dark:bg-yellow-900/20" textColor="text-yellow-700 dark:text-yellow-400" />
          <StatCard label="Drafts" value={stats.drafts} icon="📄" bgColor="bg-gray-50 dark:bg-gray-700" textColor="text-gray-700 dark:text-gray-300" />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 mb-8 transition-colors">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400"
                placeholder="Search posts..."
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
              <option value="photo-gallery">Gallery</option>
              <option value="web-story">Web Story</option>
              <option value="live-blog">Live Blog</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium transition cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium transition cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Cricket">Cricket</option>
              <option value="Sports News">Sports News</option>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {paginated.map((post) => (
                <tr key={post._id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{post.title}</td>

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

                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{getCategoryNames(post.categories)}</td>
                  
                  <td className="px-6 py-4 text-slate-600 dark:text-gray-400 text-sm">
                    {(() => {
                      const date = post.publishedAt || post.updatedAt || post.createdAt;
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
                              className="px-4 py-3 w-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left text-slate-700 dark:text-gray-300 font-medium text-sm transition"
                            >
                              Edit
                            </button>
                          </li>

                          <li>
                            {confirmDeleteIndex === `post-${post._id}` ? (
                              <div className="px-4 py-3">
                                <p className="text-xs text-red-600 dark:text-red-400 mb-2.5 font-medium">Confirm delete?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDelete(post._id)}
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
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 dark:text-gray-400">
                    {posts.length === 0 ? 'No posts found' : 'No posts match your filters'}
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

function StatCard({ label, value, icon, bgColor, textColor }) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 border border-opacity-50 dark:border-opacity-10 shadow-sm hover:shadow-md transition`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{label}</span>
        <span className="text-2xl">{icon}</span>
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

function statusClass(status) {
  const s = status?.toLowerCase() || '';
  return (
    "px-3 py-1 rounded-full text-xs font-semibold " +
    (s === "published"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : s === "pending"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300")
  );
}
