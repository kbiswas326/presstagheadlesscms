/// web>src/lib/api.js | This file contains functions to interact with the PressTag backend API. It includes functions to fetch a list of published posts and to fetch a single post by its ID. The API URL and tenant ID are configured using environment variables, and the functions handle errors gracefully by logging them and returning default values when necessary. The `getPostById` function also supports options for caching and revalidation, allowing for flexible data fetching strategies in the frontend application.
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'presstag';

const tenantHeaders = {
  'x-tenant-id': TENANT_ID,
};

// ✅ FIXED: accepts page and limit, passes skip to backend
export async function getPosts(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const res = await fetch(
      `${API_URL}/api/posts?status=published&limit=${limit}&skip=${skip}`,
      {
        cache: 'no-store',
        headers: tenantHeaders,
      }
    );
    if (!res.ok) throw new Error('Failed to fetch posts');
    const data = await res.json();
    const posts = Array.isArray(data) ? data : (data.posts || []);
    return { posts };
  } catch (error) {
    console.error(error);
    return { posts: [] };
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

    const res = await fetch(`${API_URL}/api/posts/${id}`, fetchOptions);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}