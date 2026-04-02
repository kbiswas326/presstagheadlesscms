///admin/app/posts/published/page.js | Published Posts Management Page ///
"use client";

import { useState, useEffect } from "react";
import { MoreVertical, TrendingUp, Eye, Loader, BarChart3, FileText, Film, Image as ImageIcon, Smartphone, CircleDot } from "lucide-react";
import { posts as postsAPI } from "../../../lib/api";
import { useRouter } from 'next/navigation';
import { getEditPath } from '@/utils/getEditPath';
import { useTheme } from "../../context/ThemeContext";

export default function PublishedPosts() {
  const router = useRouter();
  const { isDark } = useTheme();

  function handleEdit(post) {
    console.log('âœ… handleEdit called');
    console.log('Post object:', post);
    console.log('Post._id:', post._id);
    console.log('Post.type:', post.type);
    
    const path = getEditPath(post);
    console.log('Generated path:', path);
    
    if (path) {
      console.log('ðŸ”— Pushing to:', path);
      router.push(path);
    } else {
      console.log('âŒ Path is null - getEditPath failed');
    }
  }

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAuthor, setFilterAuthor] = useState("All");
  const [availableCategories, setAvailableCategories] = useState([]); // Store fetched categories

  const postsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const publicOrigin = process.env.NEXT_PUBLIC_PUBLIC_ORIGIN || 'http://localhost:3001';

  // =====================================================
  // HELPER: Get category names from array
  // =====================================================
  const getCategoryNames = (categoriesArray) => {
    if (!Array.isArray(categoriesArray)) return 'Uncategorized';
    return categoriesArray
      .map(cat => {
        if (typeof cat === 'string') {
          // Try to find name in availableCategories
          const found = availableCategories.find(c => c._id === cat || c.id === cat);
          return found ? found.name : cat; // Fallback to ID if not found
        }
        return cat.name || 'Uncategorized';
      })
      .join(', ') || 'Uncategorized';
  };

  // Fetch categories and published posts
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

        // 2. Fetch Posts
        console.log('ðŸ“¦ Fetching published posts...');
        const response = await postsAPI.getByStatus('published');
        
        if (response.error) {
          setError(response.error);
          setPosts([]);
        } else {
          // Handle both array response and object with posts property
          const fetchedPosts = Array.isArray(response) ? response : (response.posts || []);
          console.log('âœ… Published posts loaded:', fetchedPosts.length);
          
          // Sort by recent edited (updatedAt) or published (publishedAt)
          // User asked for "recent edited or recent published" at top.
          // We'll use the most recent of updatedAt or publishedAt
          fetchedPosts.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.publishedAt || 0);
            const dateB = new Date(b.updatedAt || b.publishedAt || 0);
            return dateB - dateA; // Descending
          });

          setPosts(fetchedPosts);
        }
      } catch (err) {
        console.error('âŒ Fetch error:', err);
        setError('Failed to fetch posts: ' + err.message);
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
    return (
      p.title.toLowerCase().includes(search.toLowerCase()) &&
      (filterType === "All" || p.type?.toLowerCase() === filterType.toLowerCase()) &&
      (filterCategory === "All" || categoryNames.toLowerCase().includes(filterCategory.toLowerCase())) &&
      (filterAuthor === "All" || p.authorName?.toLowerCase() === filterAuthor?.toLowerCase())
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
      // If clicking the menu button itself, don't close
      if (e.target.closest("button[data-menu-button]")) return;
      
      // If clicking inside the menu dropdown, don't close
      if (e.target.closest(".menu-dropdown")) return;
      
      // Otherwise close the menu
      setOpenMenuIndex(null);
      setConfirmDeleteIndex(null);
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPublicUrl = (post) => {
    const t = post.type?.toLowerCase().trim();
    const s = post.slug || post._id;
    const isWebStory = t === 'web story' || t === 'web-story' || t === 'story';
    return isWebStory ? `/web-stories/${s}` : `/posts/${s}`;
  };
  const handleDelete = async (post) => {
    try {
      const target = post.slug || post._id;
      const response = await postsAPI.remove(target);
      if (!response.error) {
        setPosts(posts.filter(p => p._id !== post._id));
        setOpenMenuIndex(null);
        setConfirmDeleteIndex(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };
  const handleUnpublish = async (post) => {
    try {
      const token = localStorage.getItem('token');
      const target = post.slug || post._id;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${target}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'draft' })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Unpublish failed');
      }
      setPosts(posts.map(p => p._id === post._id ? { ...p, status: 'draft' } : p));
      setOpenMenuIndex(null);
    } catch (err) {
      console.error('Unpublish error:', err);
    }
  };
  const handleCopyLink = (post) => {
    const path = getPublicUrl(post);
    const text = `${publicOrigin}${path}`;
    navigator.clipboard.writeText(text).then(() => {}).catch(() => {});
  };
  const handleView = (post) => {
    const path = getPublicUrl(post);
    const absolute = `${publicOrigin}${path}`;
    window.open(absolute, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading published posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="p-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-600 dark:text-gray-400 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li><a href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition">Home</a></li>
            <li className="text-slate-400 dark:text-gray-600">/</li>
            <li><a href="/posts" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition">Posts</a></li>
            <li className="text-slate-400 dark:text-gray-600">/</li>
            <li className="text-slate-900 dark:text-white font-semibold">Published</li>
          </ol>
        </nav>

        {/* Header with Icon */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Published Posts</h1>
          </div>
          <p className="text-slate-600 dark:text-gray-400 ml-14 text-lg">Manage all published content across your platform</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          <StatCard label="Total Published" value={posts.length} icon={<BarChart3 size={20} />} bgColor="bg-slate-100 dark:bg-gray-800" textColor="text-slate-700 dark:text-gray-300" iconClass="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md ring-1 ring-white/40" />
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
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium transition cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Cricket">Cricket</option>
              <option value="Sports News">Sports News</option>
            </select>

            <select
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium transition cursor-pointer"
            >
              <option value="All">All Authors</option>
              <option value="Admin User">Admin User</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden transition-colors">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 border-b border-slate-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Author</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Published</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">SEO Score</th>
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

                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{getCategoryNames(post.categories)}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-gray-300">{post.authorName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-gray-400 text-sm">
                    {(() => {
                      const published =
                        post.publishedAt ||
                        (post.publishDate
                          ? `${post.publishDate}T${post.publishTime || '00:00'}`
                          : null);

                      return published ? (
                        <div className="flex flex-col">
                          <span>
                            {new Date(published).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                            })}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-gray-500">
                            {new Date(published).toLocaleTimeString('en-GB', {
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
                      className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
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
                              className="px-4 py-3 w-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left text-slate-700 dark:text-gray-300 font-medium text-sm transition"
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
                            <button onClick={() => handleUnpublish(post)} className="px-4 py-3 w-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-left text-yellow-700 dark:text-yellow-400 font-medium text-sm transition">
                              Unpublish
                            </button>
                          </li>

                          <li>
                            <button
                              onClick={() => handleCopyLink(post)}
                              className="px-4 py-3 w-full hover:bg-slate-50 dark:hover:bg-gray-700/50 text-left text-slate-700 dark:text-gray-300 font-medium text-sm transition"
                            >
                              Copy Link
                            </button>
                          </li>

                          <li>
                            <button onClick={() => handleView(post)} className="px-4 py-3 w-full hover:bg-slate-50 dark:hover:bg-gray-700/50 text-left text-slate-700 dark:text-gray-300 font-medium text-sm flex items-center gap-2 transition">
                              <Eye size={16} />
                              View
                            </button>
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
                    {posts.length === 0 ? 'No published posts yet' : 'No posts match your filters'}
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
    <div className={`${bgColor} rounded-2xl p-6 border border-opacity-50 dark:border-opacity-20 border-black dark:border-white shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{label}</span>
        <div className={`${iconClass}`}>
          {icon}
        </div>
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
      ? "bg-yellow-200 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300")
  );
}

function seoClass(score) {
  return (
    "px-2 py-1 rounded text-xs font-semibold " +
    (score > 80
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : score >= 60
      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400")
  );
}









