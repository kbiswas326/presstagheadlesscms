"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MoreVertical, 
  TrendingUp, 
  Eye, 
  Loader, 
  BarChart3, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Filter
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { getEditPath } from '@/utils/getEditPath';

export default function PublishedPostsPage() {
  const router = useRouter();

  // Data State
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ published: 0 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  // 1. Fetch Accurate Stats for the Header Cards
  const fetchStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/stats`, {
        headers: { 
          'x-tenant-id': 'sportzpoint',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  // 2. Fetch Paginated Posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        status: 'published',
        page: currentPage.toString(),
        limit: '20',
        search: search
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?${params.toString()}`, {
        headers: { 
          'x-tenant-id': 'sportzpoint',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Posts fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search]);

  // Initial load and search debounce
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPosts(), 300);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-green-100 rounded-2xl">
            <TrendingUp className="text-green-600" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Published Posts</h1>
            <p className="text-slate-500 font-medium">
              Managing <span className="text-blue-600 font-bold">{stats.published?.toLocaleString()}</span> live articles for SportzPoint
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Published" value={stats.published} icon={<BarChart3 />} color="blue" />
        <StatCard label="Live Articles" value={stats.published} icon={<FileText />} color="green" />
      </div>

      {/* Content Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search published content..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Page {currentPage} of {pagination.totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Article</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Published Date</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="py-24 text-center">
                    <Loader className="animate-spin text-blue-600 mx-auto" size={32} />
                    <p className="text-slate-400 mt-2 font-medium">Loading your library...</p>
                  </td>
                </tr>
              ) : posts.map((post) => (
                <tr key={post._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{post.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{post.type || 'Article'}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">{post.authorName || 'Staff Writer'}</td>
                  <td className="px-6 py-5 text-sm text-slate-400">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => router.push(getEditPath(post))}
                      className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-400 hover:text-blue-600"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-bold">{posts.length}</span> of <span className="text-slate-900 font-bold">{pagination.total.toLocaleString()}</span> articles
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button 
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-2"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900">{value?.toLocaleString() || 0}</h3>
    </div>
  );
}