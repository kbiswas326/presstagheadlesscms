/**
 * admin/lib/api.js
 * Centralized API client for the Admin Dashboard.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'x-tenant-id': 'sportzpoint' // ✅ Ensures admin only sees SportzPoint data
  };
};

export const posts = {
  /**
   * Fetches posts by status with full server-side pagination support.
   * This is what allows you to browse all 14,646 articles.
   */
  getByStatus: async (status, page = 1, limit = 20, search = "") => {
    const params = new URLSearchParams({
      status: status || 'All',
      page: page.toString(),
      limit: limit.toString(),
      search: search
    });

    const res = await fetch(`${API_BASE}/posts?${params.toString()}`, {
      headers: getHeaders()
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      return { error: errorData.message || 'Failed to fetch posts' };
    }
    
    return res.json();
  },

  /**
   * Updates a specific post (e.g., changing status or content)
   */
  update: async (id, data) => {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  /**
   * Permanently deletes a post
   */
  remove: async (id) => {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  }
};

/**
 * Fetches the list of users for author mapping in the dashboard
 */
export const getUsers = async () => {
  try {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || data || [];
  } catch (err) {
    console.error("Failed to fetch users:", err);
    return [];
  }
};