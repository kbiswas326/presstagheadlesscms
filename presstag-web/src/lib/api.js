/// web/src/lib/api.js

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
  } else {
    const vercelUrl = String(process.env.VERCEL_URL || '').toLowerCase();
    if (vercelUrl.includes('sportzpoint')) return 'sportzpoint';
    if (vercelUrl.includes('presstag')) return 'presstag';
  }

  return 'presstag';
};

// ✅ UPDATED: Now properly handles new backend response format
export async function getPosts(page = 1, limit = 20, status = 'published') {
  try {
    const res = await fetch(
      `${API_BASE}/posts?status=${status}&page=${page}&limit=${limit}`,
      {
        cache: 'no-store',
        headers: { 'x-tenant-id': resolveTenantId() },
      }
    );

    if (!res.ok) throw new Error('Failed to fetch posts');

    const data = await res.json();

    // New backend returns { posts: [], pagination: { total, ... } }
    const posts = Array.isArray(data) ? data : (data.posts || []);
    const pagination = data.pagination || { total: posts.length, totalPages: 1 };

    return {
      posts,
      pagination: {
        total: pagination.total || posts.length,
        totalPages: pagination.totalPages || Math.ceil(posts.length / limit),
        currentPage: page,
        limit
      }
    };
  } catch (error) {
    console.error('Error in getPosts:', error);
    return { posts: [], pagination: { total: 0, totalPages: 1, currentPage: 1 } };
  }
}

export async function getPostById(id, options = {}) {
  try {
    const cache = options.cache || 'default';
    const revalidate = options.revalidate ?? 60;

    const fetchOptions =
      cache === 'no-store'
        ? { cache: 'no-store', headers: { 'x-tenant-id': resolveTenantId() } }
        : { next: { revalidate }, headers: { 'x-tenant-id': resolveTenantId() } };

    const res = await fetch(`${API_BASE}/posts/${id}`, fetchOptions);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getCategories(options = {}) {
  try {
    const cache = options.cache || 'no-store';
    const revalidate = options.revalidate ?? 300;

    const fetchOptions =
      cache === 'no-store'
        ? { cache: 'no-store', headers: { 'x-tenant-id': resolveTenantId() } }
        : { next: { revalidate }, headers: { 'x-tenant-id': resolveTenantId() } };

    const res = await fetch(`${API_BASE}/categories`, fetchOptions);
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories || data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
