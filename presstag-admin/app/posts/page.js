/// app/posts/page.js - Final version with accurate backend data
"use client";

import { useState, useEffect } from "react";
import { MoreVertical, Loader } from "lucide-react";
import { useRouter } from 'next/navigation';
import { getEditPath } from '@/utils/getEditPath';
import { useTheme } from '../context/ThemeContext';

export default function PostsPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [availableCategories, setAvailableCategories] = useState([]);

  const postsPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Helper to get category names
  const getCategoryNames = (categoriesArray) => {
    if (!Array.isArray(categoriesArray)) return 'Uncategorized';
    return categoriesArray
      .map(cat => (typeof cat === 'object' && cat.name) ? cat.name : cat)
      .filter(Boolean)
      .join(', ') || 'Uncategorized';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': 'sportzpoint'
        };

        // Fetch categories for filter dropdown
        const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { headers });
        if (catRes.ok) {
          const catData = await catRes.json();
          setAvailableCategories(catData.categories || catData || []);
        }

        // === FIXED: Fetch posts with pagination and total count ===
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts?page=1&limit=50`,
          { headers }
        );

        if (!res.ok) throw new Error('Failed to fetch posts');

        const data = await res.json();

        setPosts(data.posts || []);

        console.log(`✅ Loaded ${data.posts?.length || 0} posts | Total in DB: ${data.pagination?.total || 0}`);

      } catch (err) {
        console.error('❌ Fetch error:', err);
        setError('Failed to fetch posts: ' + err.message);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logic
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
  }, [filtered.length, totalPages]);

  const handleEdit = (post) => {
    const path = getEditPath(post);
    if (path) router.push(path);
  };

  const handleMenuClick = (e, key) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 200;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;

    const topPosition = spaceBelow < menuHeight 
      ? rect.top - menuHeight - 8 
      : rect.bottom + 8;

    setMenuPosition({ top: Math.max(8, topPosition), left: rect.left - 200 });
    setOpenMenuIndex(openMenuIndex === key ? null : key);
    setConfirmDeleteIndex(null);
  };

  const handleDelete = async (postId) => {
    // Add your delete logic here if needed
    console.log("Delete clicked for:", postId);
    // Example: await postsAPI.delete(postId); then refresh list
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-600 dark:text-gray-400 mb-8">
        <ol className="flex items-center space-x-2">
          <li><a href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700">Home</a></li>
          <li className="text-slate-400 dark:text-gray-600">/</li>
          <li className="text-slate-900 dark:text-white font-semibold">All Posts</li>
        </ol>
      </nav>

      <div className="flex items-center gap-3 mb-10">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <MoreVertical className="text-blue-600 dark:text-blue-400" size={24} />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">All Posts</h1>
          <p className="text-slate-600 dark:text-gray-400">
            Total Articles: <span className="font-semibold text-slate-900 dark:text-white">{posts.length}</span>
          </p>
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="All">All Types</option>
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="photo-gallery">Gallery</option>
            <option value="web-story">Web Story</option>
            <option value="live-blog">Live Blog</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="All">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </select>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="All">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
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
                  {post.publishedAt || post.updatedAt || post.createdAt 
                    ? new Date(post.publishedAt || post.updatedAt || post.createdAt).toLocaleDateString('en-GB', {
                        year: 'numeric', month: 'short', day: '2-digit'
                      })
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    data-menu-button
                    onClick={(e) => handleMenuClick(e, `post-${post._id}`)}
                    className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition text-slate-600 dark:text-gray-400 hover:text-slate-900"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Menu Dropdown - your original logic */}
                  {openMenuIndex === `post-${post._id}` && (
                    <div className="fixed bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg z-50 w-48 menu-dropdown"
                         style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}>
                      <ul className="py-1">
                        <li>
                          <button onClick={() => handleEdit(post)} className="px-4 py-3 w-full hover:bg-blue-50 text-left text-sm">
                            Edit
                          </button>
                        </li>
                        <li>
                          {confirmDeleteIndex === `post-${post._id}` ? (
                            <div className="px-4 py-3">
                              <p className="text-xs text-red-600 mb-2">Confirm delete?</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleDelete(post._id)} className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-xs">Delete</button>
                                <button onClick={() => setConfirmDeleteIndex(null)} className="flex-1 bg-gray-100 px-3 py-1.5 rounded text-xs">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteIndex(`post-${post._id}`)} className="px-4 py-3 w-full hover:bg-red-50 text-left text-red-600 text-sm">
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
                <td colSpan="6" className="text-center py-12 text-slate-500">No posts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-lg disabled:opacity-50">
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2.5 rounded-lg ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border'}`}>
              {i + 1}
            </button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-lg disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Helper functions (kept from your original)
function tagClass(type) {
  const t = type?.toLowerCase() || '';
  if (t === "article") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (t === "live-blog") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  if (t === "video") return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
  if (t === "photo-gallery") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  if (t === "web-story") return "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

function statusClass(status) {
  const s = status?.toLowerCase() || '';
  if (s === "published") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (s === "pending") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}