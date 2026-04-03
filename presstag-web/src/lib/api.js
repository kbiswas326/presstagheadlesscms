/// web/src/lib/api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'sportzpoint';

const tenantHeaders = {
  'x-tenant-id': TENANT_ID,
};

// ✅ UPDATED: Now properly handles new backend response format
export async function getPosts(page = 1, limit = 20, status = 'published') {
  try {
    const res = await fetch(
      `${API_URL}/posts?status=${status}&page=${page}&limit=${limit}`,
      {
        cache: 'no-store',
        headers: tenantHeaders,
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
        ? { cache: 'no-store', headers: tenantHeaders }
        : { next: { revalidate }, headers: tenantHeaders };

    const res = await fetch(`${API_URL}/posts/${id}`, fetchOptions);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}