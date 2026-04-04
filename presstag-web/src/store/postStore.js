import { create } from "zustand";

const normalizeApiBase = (raw) => {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:5000/api';
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

const resolveTenantId = () => {
  const envTenant = String(process.env.NEXT_PUBLIC_TENANT_ID || '').trim();
  if (envTenant) return envTenant;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('sportzpoint')) return 'sportzpoint';
    if (host.includes('presstag')) return 'presstag';
  }

  return 'presstag';
};

const withHeaders = (headers = {}) => ({
  ...headers,
  'x-tenant-id': resolveTenantId(),
});

// Helper function to process article data
const processArticle = (article) => {
  // Process article
  let categories;
  if (article.categories?.length > 0) {
    categories = article.categories;
  } else if (article.category) {
    // If we have a single category object
    if (typeof article.category === 'object' && article.category.name) {
      categories = [article.category];
    }
    // If category is a string
    else if (typeof article.category === 'string') {
      categories = [{
        name: article.category,
        slug: article.category.toLowerCase().replace(/\s+/g, '-')
      }];
    }
    else {
      categories = [{ slug: 'sports', name: 'Sports' }];
    }
  } else {
    categories = [{ slug: 'sports', name: 'Sports' }];
  }

  // Process categories
  return {
    ...article,
    categories,
    slug: article.slug || article._id?.toString() || 'article',
    published_date: article.published_date || article.createdAt || new Date().toISOString(),
    updated_at_datetime: article.updated_at_datetime || article.published_date || article.createdAt || new Date().toISOString()
  };
};

const usePostStore = create((set, get) => ({
  posts: [],
  webstory: [],
  liveBlogs: [],
  blogUpdates: [],
  loading: false,
  error: null,
  totalPages: 0,
  latestStory: [],
  singleBlog: [],
  liveScoreToggle:false,

  toggleLiveScoreBar:()=>{
    const { liveScoreToggle } = get();
    set({ liveScoreToggle: !liveScoreToggle });
  },


  fetchPosts: async (url) => {
    set({ loading: true, error: null });
    try {
      const targetUrl = (typeof url === 'string' && url)
        ? (url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`)
        : `${API_BASE}/posts?status=published&limit=20&page=1`;
      console.log('[PostStore] Fetching posts from:', targetUrl);
      const response = await fetch(targetUrl, { cache: 'no-store', headers: withHeaders() });
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();

      // Handle both array and object response formats
      let articles = [];
      let totalPages = 1;

      if (Array.isArray(data)) {
        articles = data;
      } else if (data.posts && Array.isArray(data.posts)) {
        articles = data.posts;
        if (data.pagination && data.pagination.totalPages) {
          totalPages = data.pagination.totalPages;
        }
      }

      // Process posts data
      const processedArticles = articles.map(processArticle);

      set({
        posts: processedArticles,
        totalPages: totalPages,
        loading: false,
      });
    } catch (error) {
      console.error('Posts fetch error:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchLatestStory: async (url) => {
    const targetUrl = (typeof url === 'string' && url)
      ? (url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`)
      : `${API_BASE}/posts?limit=10&status=published`;
    console.log('[PostStore] Fetching latest stories from:', targetUrl);
    set({ loading: true, error: null });
    try {
      const response = await fetch(targetUrl, { cache: 'no-store', headers: withHeaders() });
      if (!response.ok) throw new Error("Failed to fetch latest stories");
      const data = await response.json();

      // Handle both array and object response formats
      let articles = [];
      if (Array.isArray(data)) {
        articles = data;
      } else if (data.posts && Array.isArray(data.posts)) {
        articles = data.posts;
      }

      // Process latest stories
      const processedArticles = articles.map(processArticle);

      set({
        latestStory: processedArticles,
        loading: false,
      });
    } catch (error) {
      console.error('Latest stories fetch error:', error);
      set({ error: error.message, loading: false });
    }
  },
}));

export default usePostStore;
