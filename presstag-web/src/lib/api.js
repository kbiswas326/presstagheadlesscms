
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
