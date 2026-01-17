
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getPosts(page = 1, limit = 10) {
  try {
    // Note: Backend currently returns array for /posts?status=published
    // If pagination is not implemented in backend, we might get all posts.
    // We should handle that.
    const res = await fetch(`${API_URL}/api/posts?status=published`, { next: { revalidate: 60 } });
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

export async function getPostById(id) {
  try {
    const res = await fetch(`${API_URL}/api/posts/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
