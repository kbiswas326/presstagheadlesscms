/// Dashboard page with analytics, insights, and quick actions for content creation and management. - admin > app > page.js///
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, Video, Image as ImageIcon, Smartphone, Radio, 
  Clock, CheckCircle, FileEdit, Plus, BarChart2, PieChart, 
  Users, Layers, ArrowRight, TrendingUp
} from "lucide-react";
import { posts as postsAPI, auth as authAPI } from "../lib/api";
import { useRouter } from "next/navigation";
import { getEditPath } from '../utils/getEditPath';
import useDropDownDataStore from "../store/dropDownDataStore";
import { useTheme } from "./context/ThemeContext";

export default function HomePage() {
  const router = useRouter();
  const { fetchDropDownData, allCategory } = useDropDownDataStore();
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [stats, setStats] = useState({ published: 0, pending: 0, drafts: 0, total: 0 });
  const [analytics, setAnalytics] = useState({
    week: { current: 0, previous: 0, change: 0 },
    month: { current: 0, previous: 0, change: 0 },
  });
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({ topCategories: [], topAuthors: [], typeDistribution: [] });

  useEffect(() => {
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/categories`, 'category');
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/tags`, 'tag');
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/users`, 'roleBaseUser');

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const userData = await authAPI.me();
        setUser(userData);

        const [published, pending, drafts] = await Promise.all([
          postsAPI.getByStatus('published'),
          postsAPI.getByStatus('pending'),
          postsAPI.getByStatus('draft')
        ]);

        const publishedList = Array.isArray(published) ? published : (published.posts || []);
        const pendingList = Array.isArray(pending) ? pending : (pending.posts || []);
        const draftsList = Array.isArray(drafts) ? drafts : (drafts.posts || []);
        const combinedPosts = [...publishedList, ...pendingList, ...draftsList];

        setAllPosts(combinedPosts);
        setStats({
          published: publishedList.length,
          pending: pendingList.length,
          drafts: draftsList.length,
          total: combinedPosts.length
        });

        calculateAnalytics(combinedPosts);

        setRecentDrafts(
          draftsList
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 5)
        );
        setPendingPosts(
          pendingList
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 5)
        );
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (allPosts.length === 0) return;

    const catCount = {};
    allPosts.forEach(post => {
      if (Array.isArray(post.categories)) {
        post.categories.forEach(cat => {
          let catName = typeof cat === 'object' && cat.name ? cat.name : null;
          if (!catName && allCategory.length > 0) {
            const id = typeof cat === 'string' ? cat : cat._id;
            const found = allCategory.find(c => c._id === id);
            if (found) catName = found.name;
          }
          if (catName) catCount[catName] = (catCount[catName] || 0) + 1;
        });
      }
    });

    const authorCount = {};
    allPosts.forEach(post => {
      const author = post.authorName || 'Unknown';
      authorCount[author] = (authorCount[author] || 0) + 1;
    });

    const typeCount = {};
    allPosts.forEach(post => {
      const type = post.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    setInsights({
      topCategories: Object.entries(catCount).sort(([,a],[,b]) => b-a).slice(0,5)
        .map(([name, count]) => ({ name, count, percentage: Math.round((count/allPosts.length)*100) })),
      topAuthors: Object.entries(authorCount).sort(([,a],[,b]) => b-a).slice(0,5)
        .map(([name, count]) => ({ name, count })),
      typeDistribution: Object.entries(typeCount).sort(([,a],[,b]) => b-a)
        .map(([name, count]) => ({ name, count, percentage: Math.round((count/allPosts.length)*100) })),
    });
  }, [allPosts, allCategory]);

  const calculateAnalytics = (posts) => {
    const now = new Date();
    const oneDay = 86400000;
    const inRange = (dateStr, from, to) => {
      if (!dateStr) return false;
      const diff = Math.ceil(Math.abs(now - new Date(dateStr)) / oneDay);
      return diff > from && diff <= to;
    };
    const getDate = (p) => p.createdAt || p.updatedAt || p.publishedAt;
    setAnalytics({
      week: {
        current: posts.filter(p => inRange(getDate(p), 0, 7)).length,
        previous: posts.filter(p => inRange(getDate(p), 7, 14)).length,
        change: (() => {
          const cur = posts.filter(p => inRange(getDate(p), 0, 7)).length;
          const prev = posts.filter(p => inRange(getDate(p), 7, 14)).length;
          return prev === 0 ? 100 : Math.round(((cur - prev) / prev) * 100);
        })()
      },
      month: {
        current: posts.filter(p => inRange(getDate(p), 0, 30)).length,
        previous: posts.filter(p => inRange(getDate(p), 30, 60)).length,
        change: (() => {
          const cur = posts.filter(p => inRange(getDate(p), 0, 30)).length;
          const prev = posts.filter(p => inRange(getDate(p), 30, 60)).length;
          return prev === 0 ? 100 : Math.round(((cur - prev) / prev) * 100);
        })()
      },
    });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-8">
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {user?.name?.split(' ')[0] || "Editor"} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Overview of your content performance and recent activity.
            </p>
          </div>
          <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">

        {/* Analytics Cards */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Content Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard title="Posts This Week" value={analytics.week.current} change={analytics.week.change} subtext={`vs ${analytics.week.previous} last week`} />
            <MetricCard title="Posts This Month" value={analytics.month.current} change={analytics.month.change} subtext={`vs ${analytics.month.previous} last month`} />
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Content</p>
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
              <div className="flex gap-3 mt-4 text-xs font-medium flex-wrap">
                <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>{stats.published} Published
                </span>
                <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>{stats.pending} Pending
                </span>
                <span className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>{stats.drafts} Drafts
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <QuickAction href="/posts/article" icon={<FileText size={22}/>} label="Article" description="Standard post" gradient="from-blue-500 to-blue-600"/>
            <QuickAction href="/posts/video" icon={<Video size={22}/>} label="Video" description="Upload or embed" gradient="from-purple-500 to-purple-600"/>
            <QuickAction href="/posts/photo-gallery" icon={<ImageIcon size={22}/>} label="Gallery" description="Image collection" gradient="from-pink-500 to-pink-600"/>
            <QuickAction href="/posts/web-story" icon={<Smartphone size={22}/>} label="Web Story" description="Visual story" gradient="from-amber-500 to-amber-600"/>
            <QuickAction href="/posts/live-blog" icon={<Radio size={22}/>} label="Live Blog" description="Real-time updates" gradient="from-red-500 to-red-600"/>
          </div>
        </section>

        {/* Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Layers className="w-5 h-5 text-purple-600"/>
              <h3 className="font-bold text-gray-900 dark:text-white">Top Categories</h3>
            </div>
            <div className="space-y-4">
              {insights.topCategories.length > 0 ? insights.topCategories.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-bold">{cat.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width:`${cat.percentage}%`}}></div>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-4">No category data yet.</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <PieChart className="w-5 h-5 text-blue-600"/>
              <h3 className="font-bold text-gray-900 dark:text-white">Content Types</h3>
            </div>
            <div className="space-y-3">
              {insights.typeDistribution.length > 0 ? insights.typeDistribution.map((type, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${getTypeColor(type.name)}`}></span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{type.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{type.percentage}%</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{type.count}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-4">No content yet.</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-5 h-5 text-amber-600"/>
              <h3 className="font-bold text-gray-900 dark:text-white">Top Authors</h3>
            </div>
            <div className="space-y-3">
              {insights.topAuthors.length > 0 ? insights.topAuthors.map((author, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold">
                      {author.name.substring(0,2).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">{author.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{author.count}</span>
                </div>
              )) : <p className="text-sm text-gray-400 text-center py-4">No author data yet.</p>}
            </div>
          </div>
        </section>

        {/* Pending + Drafts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500"/> Pending Approval
              </h3>
              {pendingPosts.length > 0 && (
                <Link href="/posts/pending-approval" className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3"/>
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {pendingPosts.length > 0 ? pendingPosts.map(post => (
                <div key={post._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/40 group">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getTypeBadgeClass(post.type)}`}>{post.type}</span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-1">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">by {post.authorName || 'Unknown'}</p>
                  </div>
                  <Link href="/posts/pending-approval" className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Review
                  </Link>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                  <CheckCircle className="w-8 h-8 mb-2 text-gray-300"/>
                  <p className="text-sm">All caught up! No pending posts.</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-blue-500"/> Recent Drafts
              </h3>
              {recentDrafts.length > 0 && (
                <Link href="/posts/drafts" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3"/>
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentDrafts.length > 0 ? recentDrafts.map(post => (
                <div key={post._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/40 group">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getTypeBadgeClass(post.type)}`}>{post.type}</span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-1">{post.title || "Untitled Draft"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(post.updatedAt || post.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Link href={getEditPath(post)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                    <FileEdit size={16}/>
                  </Link>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                  <FileEdit className="w-8 h-8 mb-2 text-gray-300"/>
                  <p className="text-sm">No drafts found.</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, subtext }) {
  const isPositive = change >= 0;
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{title}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{value}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${isPositive ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
          <TrendingUp className={`w-3 h-3 ${!isPositive ? 'rotate-180' : ''}`}/>
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-2">{subtext}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, description, gradient }) {
  return (
    <Link href={href} className="group flex flex-col items-start p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{label}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</span>
    </Link>
  );
}

function getTypeBadgeClass(type) {
  switch (type?.toLowerCase()) {
    case 'article': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'video': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    case 'photo-gallery': return 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400';
    case 'web-story': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
    case 'live-blog': return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default: return 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
  }
}

function getTypeColor(type) {
  switch (type?.toLowerCase()) {
    case 'article': return 'bg-blue-500';
    case 'video': return 'bg-purple-500';
    case 'photo-gallery': return 'bg-pink-500';
    case 'web-story': return 'bg-amber-500';
    case 'live-blog': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}