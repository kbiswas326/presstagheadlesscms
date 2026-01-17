"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Smartphone, 
  Radio, 
  Clock, 
  CheckCircle, 
  FileEdit, 
  Plus,
  BarChart2,
  PieChart,
  Users,
  Layers,
  ArrowRight,
  Activity,
  TrendingUp
} from "lucide-react";
import { posts as postsAPI, auth as authAPI } from "../lib/api";
import { useRouter } from "next/navigation";
import { getEditPath } from '@/utils/getEditPath';
import useDropDownDataStore from "@/store/dropDownDataStore";
import { useTheme } from "./context/ThemeContext";

export default function HomePage() {
  const router = useRouter();
  const { fetchDropDownData, allCategory } = useDropDownDataStore();
  const { isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [stats, setStats] = useState({
    published: 0,
    pending: 0,
    drafts: 0,
    total: 0
  });
  const [analytics, setAnalytics] = useState({
    week: { current: 0, previous: 0, change: 0 },
    month: { current: 0, previous: 0, change: 0 },
    dailyActivity: [] // Last 7 days
  });
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Insights State
  const [insights, setInsights] = useState({
    topCategories: [],
    topAuthors: [],
    typeDistribution: []
  });

  useEffect(() => {
    // Pre-fetch dropdown data
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/categories`, 'category');
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/tags`, 'tag');
    fetchDropDownData(`${process.env.NEXT_PUBLIC_API_URL}/users`, 'roleBaseUser');

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch User
        const userData = await authAPI.me();
        setUser(userData);

        // 2. Fetch Posts
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

        // 3. Calculate Analytics
        calculateAnalytics(combinedPosts);

        // 4. Set Lists
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
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate Insights when posts or categories change
  useEffect(() => {
    if (allPosts.length === 0) return;

    // 1. Top Categories
    const catCount = {};
    allPosts.forEach(post => {
      if (Array.isArray(post.categories)) {
        post.categories.forEach(cat => {
          // Handle both populated objects and ID strings
          const catId = typeof cat === 'string' ? cat : (cat._id || cat.id);
          // Try to find name in allCategory if we have an ID
          let catName = 'Uncategorized';
          if (typeof cat === 'object' && cat.name) {
            catName = cat.name;
          } else if (allCategory.length > 0) {
            const found = allCategory.find(c => c._id === catId || c.id === catId);
            if (found) catName = found.name;
          }
          
          if (catName !== 'Uncategorized') {
            catCount[catName] = (catCount[catName] || 0) + 1;
          }
        });
      }
    });

    const sortedCategories = Object.entries(catCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / allPosts.length) * 100) }));

    // 2. Top Authors
    const authorCount = {};
    allPosts.forEach(post => {
      const author = post.authorName || 'Unknown';
      authorCount[author] = (authorCount[author] || 0) + 1;
    });

    const sortedAuthors = Object.entries(authorCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 3. Type Distribution
    const typeCount = {};
    allPosts.forEach(post => {
      const type = post.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const sortedTypes = Object.entries(typeCount)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / allPosts.length) * 100) }));

    setInsights({
      topCategories: sortedCategories,
      topAuthors: sortedAuthors,
      typeDistribution: sortedTypes
    });

  }, [allPosts, allCategory]);

  const calculateAnalytics = (posts) => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Helper to check if date is in range
    const isInRange = (dateStr, daysAgoStart, daysAgoEnd) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / oneDay);
      return diffDays > daysAgoStart && diffDays <= daysAgoEnd;
    };

    // Helper to get valid date from post
    const getDate = (p) => p.createdAt || p.updatedAt || p.publishedAt;

    // Weekly Stats (Last 7 days vs Previous 7 days)
    const thisWeekCount = posts.filter(p => isInRange(getDate(p), 0, 7)).length;
    const lastWeekCount = posts.filter(p => isInRange(getDate(p), 7, 14)).length;
    
    // Monthly Stats (Last 30 days vs Previous 30 days)
    const thisMonthCount = posts.filter(p => isInRange(getDate(p), 0, 30)).length;
    const lastMonthCount = posts.filter(p => isInRange(getDate(p), 30, 60)).length;

    // Daily Activity (Last 14 days for chart)
    const dailyData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - (i * oneDay));
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = posts.filter(p => {
        const dateVal = getDate(p);
        if (!dateVal) return false;
        const pDate = new Date(dateVal);
        if (isNaN(pDate.getTime())) return false;
        return pDate.getDate() === d.getDate() && pDate.getMonth() === d.getMonth() && pDate.getFullYear() === d.getFullYear();
      }).length;
      dailyData.push({ date: dateStr, count });
    }

    setAnalytics({
      week: {
        current: thisWeekCount,
        previous: lastWeekCount,
        change: lastWeekCount === 0 ? 100 : Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      },
      month: {
        current: thisMonthCount,
        previous: lastMonthCount,
        change: lastMonthCount === 0 ? 100 : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
      },
      dailyActivity: dailyData
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-8 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
      {/* Header with Glassmorphism */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/50 shadow-sm transition-colors">
        <div className="w-full px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                {getGreeting()}, {user?.name?.split(' ')[0] || "Editor"}! 👋
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Overview of your content performance and recent activity.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium border border-white/40 dark:border-gray-600/50 shadow-sm transition-colors">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-6 space-y-6">
        
        {/* 1. Analytics & Overview Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Content Analytics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Stat */}
            <MetricCard 
              title="Posts This Week"
              value={analytics.week.current}
              change={analytics.week.change}
              subtext={`vs ${analytics.week.previous} last week`}
              gradient="from-blue-500 to-cyan-400"
            />

            {/* Monthly Stat */}
            <MetricCard 
              title="Posts This Month"
              value={analytics.month.current}
              change={analytics.month.change}
              subtext={`vs ${analytics.month.previous} last month`}
              gradient="from-purple-500 to-pink-400"
            />

            {/* Total Stat */}
            <div className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Content</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                  {stats.total}
                </span>
              </div>
              <div className="flex gap-4 mt-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-100 dark:border-green-900/30">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> {stats.published} Pub
                </span>
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-900/30">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> {stats.pending} Pen
                </span>
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-900/30">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> {stats.drafts} Drf
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Quick Actions Section (Moved Here) */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
              <Plus className="w-5 h-5" />
            </div>
            Create New
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <QuickAction 
              href="/posts/article" 
              icon={<FileText size={24} />} 
              label="Article" 
              description="Standard post"
              gradient="from-blue-500 to-blue-600"
              shadow="shadow-blue-200 dark:shadow-blue-900/20"
            />
            <QuickAction 
              href="/posts/video" 
              icon={<Video size={24} />} 
              label="Video" 
              description="Upload or embed"
              gradient="from-purple-500 to-purple-600"
              shadow="shadow-purple-200 dark:shadow-purple-900/20"
            />
            <QuickAction 
              href="/posts/photo-gallery" 
              icon={<ImageIcon size={24} />} 
              label="Gallery" 
              description="Image collection"
              gradient="from-pink-500 to-pink-600"
              shadow="shadow-pink-200 dark:shadow-pink-900/20"
            />
            <QuickAction 
              href="/posts/web-story" 
              icon={<Smartphone size={24} />} 
              label="Web Story" 
              description="Visual story"
              gradient="from-amber-500 to-amber-600"
              shadow="shadow-amber-200 dark:shadow-amber-900/20"
            />
            <QuickAction 
              href="/posts/live-blog" 
              icon={<Radio size={24} />} 
              label="Live Blog" 
              description="Real-time updates"
              gradient="from-red-500 to-red-600"
              shadow="shadow-red-200 dark:shadow-red-900/20"
            />
          </div>
        </section>

        {/* 3. Insights Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Categories */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-all duration-300">
             <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Categories</h2>
             </div>
             <div className="space-y-4">
               {insights.topCategories.length > 0 ? (
                 insights.topCategories.map((cat, i) => (
                   <div key={i} className="group">
                     <div className="flex justify-between text-sm mb-2">
                       <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">{cat.name}</span>
                       <span className="text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{cat.count}</span>
                     </div>
                     <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                       <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${cat.percentage}%` }}
                       ></div>
                     </div>
                   </div>
                 ))
               ) : (
                 <p className="text-sm text-gray-400 text-center py-4">No category data available.</p>
               )}
             </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-all duration-300">
             <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <PieChart className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Content Types</h2>
             </div>
             <div className="space-y-4">
               {insights.typeDistribution.map((type, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors group">
                   <div className="flex items-center gap-3">
                     <span className={`w-3 h-3 rounded-full shadow-sm ${getTypeColor(type.name)}`}></span>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{type.name}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-600 shadow-sm">{type.percentage}%</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{type.count}</span>
                   </div>
                 </div>
               ))}
               {insights.typeDistribution.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No content type data.</p>}
             </div>
          </div>

          {/* Top Authors */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-all duration-300">
             <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Authors</h2>
             </div>
             <div className="space-y-4">
               {insights.topAuthors.length > 0 ? (
                 insights.topAuthors.map((author, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors group">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold border border-amber-200 dark:border-amber-800 shadow-sm group-hover:scale-110 transition-transform">
                         {author.name.substring(0, 2).toUpperCase()}
                       </div>
                       <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{author.name}</span>
                     </div>
                     <span className="text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-600 shadow-sm">{author.count}</span>
                   </div>
                 ))
               ) : (
                 <p className="text-sm text-gray-400 text-center py-4">No author data available.</p>
               )}
             </div>
          </div>
        </section>

        {/* 4. Recent Activity (Split View) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pending Approval */}
          <section className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm flex flex-col h-full overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="p-6 border-b border-gray-100/50 dark:border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                Pending Approval
              </h3>
              {pendingPosts.length > 0 && (
                <Link href="/posts/pending-approval" className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-100/50 dark:divide-gray-700/50 flex-1">
              {pendingPosts.length > 0 ? (
                pendingPosts.map((post) => (
                  <div key={post._id} className="p-4 hover:bg-white/80 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md shadow-sm border border-white/50 dark:border-gray-600/50 ${getTypeBadgeClass(post.type)}`}>
                          {post.type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">by {post.authorName || 'Unknown'}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {post.title}
                      </h4>
                    </div>
                    <Link 
                      href="/posts/pending-approval"
                      className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-sm shadow-amber-200 dark:shadow-amber-900/30 hover:shadow-md hover:scale-105 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300"
                    >
                      Review
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400 dark:text-gray-500">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full mb-3">
                    <CheckCircle className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium">All caught up! No pending posts.</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Drafts */}
          <section className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm flex flex-col h-full overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="p-6 border-b border-gray-100/50 dark:border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                Recent Drafts
              </h3>
              {recentDrafts.length > 0 && (
                <Link href="/posts/drafts" className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-100/50 dark:divide-gray-700/50 flex-1">
              {recentDrafts.length > 0 ? (
                recentDrafts.map((post) => (
                  <div key={post._id} className="p-4 hover:bg-white/80 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md shadow-sm border border-white/50 dark:border-gray-600/50 ${getTypeBadgeClass(post.type)}`}>
                          {post.type}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title || "Untitled Draft"}
                      </h4>
                    </div>
                    <Link 
                      href={getEditPath(post)}
                      className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all hover:scale-110 hover:shadow-sm"
                    >
                      <FileEdit size={18} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400 dark:text-gray-500">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full mb-3">
                    <FileEdit className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium">No drafts found.</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, subtext, gradient }) {
  const isPositive = change >= 0;
  return (
    <div className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden">
      {/* Background Gradient Blur */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 dark:opacity-20 blur-2xl rounded-full group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity`}></div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2 relative z-10">{title}</p>
      <div className="flex items-baseline gap-3 relative z-10">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{value}</span>
        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full border ${
          isPositive 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/50' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 font-medium relative z-10">{subtext}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, description, gradient, shadow }) {
  return (
    <Link 
      href={href}
      className="group flex flex-col items-start p-5 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/40 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.03] relative overflow-hidden"
    >
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 shadow-md ${shadow} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{description}</span>
      
      {/* Hover Light Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/40 dark:from-white/0 dark:to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </Link>
  );
}

function getTypeBadgeClass(type) {
  const t = type?.toLowerCase();
  switch (t) {
    case 'article': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
    case 'video': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30';
    case 'photo-gallery': return 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-pink-100 dark:border-pink-900/30';
    case 'web-story': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
    case 'live-blog': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30';
    default: return 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border-gray-100 dark:border-gray-600/50';
  }
}

function getTypeColor(type) {
  const t = type?.toLowerCase();
  switch (t) {
    case 'article': return 'bg-blue-500';
    case 'video': return 'bg-purple-500';
    case 'photo-gallery': return 'bg-pink-500';
    case 'web-story': return 'bg-amber-500';
    case 'live-blog': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}
