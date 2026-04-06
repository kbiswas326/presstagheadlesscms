/// app/page.js - Dashboard with accurate stats from backend
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, Video, Image as ImageIcon, Smartphone, Radio, 
  Clock, CheckCircle, FileEdit, Plus, BarChart2,
  ArrowRight, TrendingUp, TrendingDown, Users, Hash
} from "lucide-react";
import { auth as authAPI, getTenantId } from "../lib/api";
import { useRouter } from "next/navigation";
import { getEditPath } from '../utils/getEditPath';
import useDropDownDataStore from "../store/dropDownDataStore";
import { useTheme } from "./context/ThemeContext";

export default function HomePage() {
  const router = useRouter();
  const { fetchDropDownData } = useDropDownDataStore();
  const { isDark } = useTheme();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, drafts: 0 });
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(7);
  const [insights, setInsights] = useState(null);
  const [gaSummary, setGaSummary] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ✅ FIX: NEXT_PUBLIC_API_URL already ends without /api in some setups.
  // The stats endpoint is at /api/posts/stats — build the URL carefully.
  const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

  useEffect(() => {
    fetchDropDownData(`${BASE}/api/categories`, 'category');
    fetchDropDownData(`${BASE}/api/tags`, 'tag');
    fetchDropDownData(`${BASE}/api/users`, 'roleBaseUser');

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const userData = await authAPI.me();
        setUser(userData);

        const token = localStorage.getItem('token') || '';
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        };

        // ✅ FIX: Use BASE so URL is never /api/api/posts/stats
        const statsRes = await fetch(`${BASE}/api/posts/stats`, {
          headers,
          cache: 'no-store',
        });

        if (!statsRes.ok) throw new Error(`Stats fetch failed: ${statsRes.status}`);

        const statsData = await statsRes.json();
        setStats({
          total: statsData.totalArticles || 0,
          published: statsData.published || 0,
          pending: statsData.pending || 0,
          drafts: statsData.drafts || 0,
        });

        // Fetch only 5 recent items for the UI panels — never all posts
        const [pendingRes, draftsRes] = await Promise.all([
          fetch(`${BASE}/api/posts?status=pending&limit=5`, { headers }),
          fetch(`${BASE}/api/posts?status=draft&limit=5`, { headers }),
        ]);

        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          // Backend returns array directly OR { posts: [] }
          setPendingPosts(
            Array.isArray(pendingData) ? pendingData : (pendingData.posts || [])
          );
        }

        if (draftsRes.ok) {
          const draftsData = await draftsRes.json();
          const draftsArr = Array.isArray(draftsData)
            ? draftsData
            : (draftsData.posts || []);
          setRecentDrafts(
            draftsArr.sort(
              (a, b) =>
                new Date(b.updatedAt || b.createdAt) -
                new Date(a.updatedAt || a.createdAt)
            )
          );
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setInsightsLoading(true);
        const token = localStorage.getItem('token') || '';
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        };

        const [insightsRes, gaRes] = await Promise.all([
          fetch(`${BASE}/api/posts/insights?days=${rangeDays}`, { headers, cache: 'no-store' }),
          fetch(`${BASE}/api/analytics/ga4/summary?days=${rangeDays}`, { headers, cache: 'no-store' }),
        ]);

        if (insightsRes.ok) setInsights(await insightsRes.json());
        else setInsights(null);

        if (gaRes.ok) setGaSummary(await gaRes.json());
        else setGaSummary(null);
      } catch (error) {
        console.error("Insights fetch error:", error);
        setInsights(null);
        setGaSummary(null);
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchInsights();
  }, [BASE, rangeDays]);

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
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">

        {/* Stats Cards — numbers come from /api/posts/stats, never from post array length */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Content Analytics</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRangeDays(7)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  rangeDays === 7
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setRangeDays(30)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  rangeDays === 30
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              label="Total Articles"
              value={stats.total.toLocaleString()}
              color="bg-blue-50 dark:bg-blue-900/20"
              textColor="text-blue-700 dark:text-blue-400"
              dot="bg-blue-500"
            />
            <StatCard
              label="Published"
              value={stats.published.toLocaleString()}
              color="bg-green-50 dark:bg-green-900/20"
              textColor="text-green-700 dark:text-green-400"
              dot="bg-green-500"
            />
            <StatCard
              label="Pending"
              value={stats.pending.toLocaleString()}
              color="bg-amber-50 dark:bg-amber-900/20"
              textColor="text-amber-700 dark:text-amber-400"
              dot="bg-amber-500"
            />
            <StatCard
              label="Drafts"
              value={stats.drafts.toLocaleString()}
              color="bg-purple-50 dark:bg-purple-900/20"
              textColor="text-purple-700 dark:text-purple-400"
              dot="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <InsightCard
              label={`Published (last ${rangeDays} days)`}
              value={insights?.published?.current ?? '—'}
              loading={insightsLoading}
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              delta={insights?.published?.delta}
              deltaPct={insights?.published?.deltaPct}
              compareLabel={`vs prev ${rangeDays} days`}
            />
            <KeyValueCard
              label={`Top Author (last ${rangeDays} days)`}
              value={insights?.topAuthor?.name || '—'}
              subValue={insights?.topAuthor?.count ? `${insights.topAuthor.count} posts` : ''}
              loading={insightsLoading}
              icon={<Users className="w-5 h-5 text-blue-600" />}
            />
            <KeyValueCard
              label={`Top Category (last ${rangeDays} days)`}
              value={insights?.topCategory?.name || '—'}
              subValue={insights?.topCategory?.count ? `${insights.topCategory.count} posts` : ''}
              loading={insightsLoading}
              icon={<Hash className="w-5 h-5 text-purple-600" />}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Traffic (Google Analytics)</h2>
          </div>
          {gaSummary?.configured ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <StatCard
                label={`Active Users (${rangeDays}d)`}
                value={Number(gaSummary?.totals?.activeUsers || 0).toLocaleString()}
                color="bg-emerald-50 dark:bg-emerald-900/20"
                textColor="text-emerald-700 dark:text-emerald-400"
                dot="bg-emerald-500"
              />
              <StatCard
                label={`Sessions (${rangeDays}d)`}
                value={Number(gaSummary?.totals?.sessions || 0).toLocaleString()}
                color="bg-blue-50 dark:bg-blue-900/20"
                textColor="text-blue-700 dark:text-blue-400"
                dot="bg-blue-500"
              />
              <StatCard
                label={`Page Views (${rangeDays}d)`}
                value={Number(gaSummary?.totals?.pageViews || 0).toLocaleString()}
                color="bg-purple-50 dark:bg-purple-900/20"
                textColor="text-purple-700 dark:text-purple-400"
                dot="bg-purple-500"
              />

              <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">Top Pages</h3>
                  <span className="text-xs text-gray-400">Last {rangeDays} days</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(gaSummary.topPages || []).slice(0, 8).map((p) => (
                    <div key={p.path} className="p-4 flex items-center justify-between">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.path}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{Number(p.views || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {(gaSummary.topPages || []).length === 0 && (
                    <div className="p-10 text-center text-gray-400 text-sm">
                      No GA data found for this range.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-sm text-gray-600 dark:text-gray-300">
              Connect GA4 in Settings → Website Customization → Integrations to show traffic snippets on this dashboard.
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <QuickAction href="/posts/article" icon={<FileText size={22} />} label="Article" description="Standard post" gradient="from-blue-500 to-blue-600" />
            <QuickAction href="/posts/video" icon={<Video size={22} />} label="Video" description="Upload or embed" gradient="from-purple-500 to-purple-600" />
            <QuickAction href="/posts/photo-gallery" icon={<ImageIcon size={22} />} label="Gallery" description="Image collection" gradient="from-pink-500 to-pink-600" />
            <QuickAction href="/posts/web-story" icon={<Smartphone size={22} />} label="Web Story" description="Visual story" gradient="from-amber-500 to-amber-600" />
            <QuickAction href="/posts/live-blog" icon={<Radio size={22} />} label="Live Blog" description="Real-time updates" gradient="from-red-500 to-red-600" />
          </div>
        </section>

        {/* Pending + Drafts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Pending Approval
              </h3>
              {pendingPosts.length > 0 && (
                <Link href="/posts/pending-approval" className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {pendingPosts.length > 0 ? pendingPosts.map(post => (
                <div key={post._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/40 group">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getTypeBadgeClass(post.type)}`}>
                      {post.type}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-1">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">by {post.authorName || 'Unknown'}</p>
                  </div>
                  <Link href="/posts/pending-approval" className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Review
                  </Link>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                  <CheckCircle className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-sm">All caught up! No pending posts.</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-blue-500" /> Recent Drafts
              </h3>
              {recentDrafts.length > 0 && (
                <Link href="/posts/drafts" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentDrafts.length > 0 ? recentDrafts.map(post => (
                <div key={post._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/40 group">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getTypeBadgeClass(post.type)}`}>
                      {post.type}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-1">
                      {post.title || "Untitled Draft"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(post.updatedAt || post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={getEditPath(post)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                    <FileEdit size={16} />
                  </Link>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                  <FileEdit className="w-8 h-8 mb-2 text-gray-300" />
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

function InsightCard({ label, value, icon, delta, deltaPct, compareLabel, loading }) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  const displayValue = Number.isFinite(numericValue) ? numericValue.toLocaleString() : String(value ?? '—');
  const d = typeof delta === 'number' ? delta : (delta === 0 ? 0 : null);
  const pct = typeof deltaPct === 'number' ? deltaPct : null;
  const isUp = typeof d === 'number' ? d >= 0 : null;
  const trendColor = isUp === null ? 'text-gray-500' : (isUp ? 'text-emerald-600' : 'text-red-600');
  const trendBg = isUp === null ? 'bg-gray-50 dark:bg-gray-700/40' : (isUp ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20');

  return (
    <div className={`${trendBg} rounded-2xl p-6 border border-black/5 dark:border-white/10 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        </div>
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 dark:text-white">
        {loading ? '—' : displayValue}
      </div>
      <div className={`mt-2 text-xs font-semibold flex items-center gap-2 ${trendColor}`}>
        {typeof d === 'number' ? (isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />) : null}
        {typeof d === 'number'
          ? `${d >= 0 ? '+' : ''}${d.toLocaleString()}${pct !== null ? ` (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)` : ''} ${compareLabel || ''}`
          : (loading ? '' : 'No comparison data')}
      </div>
    </div>
  );
}

function KeyValueCard({ label, value, subValue, icon, loading }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white truncate">
        {loading ? '—' : (value || '—')}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {loading ? '' : (subValue || '')}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, textColor, dot }) {
  return (
    <div className={`${color} rounded-2xl p-6 border border-black/5 dark:border-white/10 shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${dot}`}></span>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      </div>
      <span className={`text-4xl font-bold ${textColor}`}>{value}</span>
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
