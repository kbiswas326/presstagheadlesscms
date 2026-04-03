/// app/posts/page.js - Final version with accurate backend data
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MoreVertical, 
  Loader, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  FileEdit,
  Trash2,
  ExternalLink
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { getEditPath } from '@/utils/getEditPath';

export default function PostsPage() {
  const router = useRouter();

  // State for Data
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });

  // State for Filters & Pagination
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // UI State
  const [openMenuId, setOpenMenuId] = useState(null);

  // ✅ FETCH FUNCTION: Calls backend with pagination params
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Construct Query String
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        tenantId: "sportzpoint" // Explicitly setting tenant
      });

      if (statusFilter !== "All") params.append("status", statusFilter.toLowerCase());
      if (typeFilter !== "All") params.append("type", typeFilter.toLowerCase());
      if (search) params.append("search", search);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': 'sportzpoint', // Header for backend middleware
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      
      // ✅ Set the full count and paginated list
      setPosts(data.posts || []);
      setPagination(data.pagination || { total: 0, totalPages: 1, page: 1 });
      
    } catch (err) {
      console.error("❌ Error fetching posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, typeFilter, search]);

  // Trigger fetch on change (with debounce for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Content Library</h1>
            <p className="text-slate-500 mt-1">
              Managing <span className="font-bold text-blue-600">{pagination.total.toLocaleString()}</span> total articles for SportzPoint
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Pending">Pending</option>
              <option value="Draft">Draft</option>
            </select>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
              <ExternalLink size={16} /> New Post
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Article Details</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="animate-spin text-blue-600" size={32} />
                      <p className="text-slate-400 font-medium">Fetching your content...</p>
                    </div>
                  </td>
                </tr>
              ) : posts.length > 0 ? (posts.map((post) => (
                <tr key={post._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                        <img 
                          src={post.thumbnail || `https://picsum.photos/seed/${post._id}/100/100`} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate max-w-md group-hover:text-blue-600 transition-colors">
                          {post.title || "Untitled Post"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">by {post.authorName || "Staff Writer"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyles(post.status)}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 capitalize">{post.type || 'Article'}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === post._id ? null : post._id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {openMenuId === post._id && (
                      <div className="absolute right-6 top-12 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                        <button onClick={() => router.push(getEditPath(post))} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                          <FileEdit size={16} /> Edit Article
                        </button>
                        <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600">
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-400">No articles found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ PAGINATION FOOTER */}
        <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-medium">
            Showing page <span className="text-slate-900 font-bold">{pagination.page}</span> of <span className="text-slate-900 font-bold">{pagination.totalPages}</span>
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            
            <div className="hidden sm:flex items-center gap-1">
              {/* Show a few page numbers around current page */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button 
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm flex items-center gap-2"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for Status Badge Styles
function getStatusStyles(status) {
  switch (status?.toLowerCase()) {
    case 'published': return 'bg-green-50 text-green-700 border-green-100';
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'draft': return 'bg-slate-50 text-slate-600 border-slate-200';
    case 'live-blog': return 'bg-red-50 text-red-700 border-red-100';
    default: return 'bg-slate-50 text-slate-500 border-slate-100';
  }
}