/// web> src> lib> api.js | API utility functions for fetching posts and post details from the backend. The getPosts function retrieves a list of published posts with pagination support, while the getPostById function fetches detailed information about a specific post by its ID. Both functions handle errors gracefully and return default values in case of failures. The API URL is configured using an environment variable for flexibility across different deployment environments. // --- IGNORE ---
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getPosts(page = 1, limit = 10) {
  try {
    // Don't cache published posts since they can be updated/republished frequently
    const res = await fetch(`${API_URL}/api/posts?status=published`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch posts');
    const data = await res.json();
    // Normalize to array
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
        ? { cache: 'no-store' }
        : { next: { revalidate } };
    
    const res = await fetch(`${API_URL}/api/posts/${id}`, fetchOptions);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
