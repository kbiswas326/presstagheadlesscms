/**
 * admin/lib/api.js
 * Centralized API client for the Admin Dashboard.
 */

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

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'x-tenant-id': resolveTenantId()
  };
};

export const getTenantId = () => resolveTenantId();

export const posts = {
  /**
   * Fetches posts by status with full server-side pagination support.
   * This is what allows you to browse all 14,646 articles.
   */
  getByStatus: async (status, pageOrOptions = 1, limit = 20, search = "") => {
    const options = (pageOrOptions && typeof pageOrOptions === 'object')
      ? pageOrOptions
      : { page: pageOrOptions, limit, search };

    const params = new URLSearchParams({
      status: status || options.status || 'All',
      page: String(options.page ?? 1),
      limit: String(options.limit ?? 20),
    });

    if (options.search) params.set('search', String(options.search));
    if (options.type && options.type !== 'All') params.set('type', String(options.type));
    if (options.author && options.author !== 'All') params.set('author', String(options.author));
    if (options.category && options.category !== 'All') params.set('category', String(options.category));
    if (options.tag && options.tag !== 'All') params.set('tag', String(options.tag));
    if (options.sort) params.set('sort', String(options.sort));

    const res = await fetch(`${API_BASE}/posts?${params.toString()}`, {
      headers: getHeaders()
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      return { error: errorData.message || 'Failed to fetch posts' };
    }
    
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      headers: getHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error || json.message || 'Failed to fetch post' };
    return json;
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error || json.message || 'Failed to create post' };
    return json;
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

export const auth = {
  login: async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': resolveTenantId(),
      },
      body: JSON.stringify({ email, password }),
    });

    return res.json();
  },

  me: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) return null;
    return res.json();
  },

  refresh: async (token) => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'x-tenant-id': resolveTenantId(),
      },
    });

    if (!res.ok) return null;
    return res.json();
  },
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

export const createUser = async (data) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolveTenantId(),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to create user');
  return json;
};

export const updateUser = async (id, data) => {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to update user');
  return json;
};

export const deleteUser = async (id) => {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to delete user');
  return json;
};

export const getCategories = async (options = {}) => {
  const withCounts = options?.withCounts !== false;
  const params = new URLSearchParams();
  if (!withCounts) params.set('withCounts', '0');
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/categories${suffix}`, { headers: getHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to fetch categories');
  return json;
};

export const getLayoutConfig = async () => {
  const res = await fetch(`${API_BASE}/layout-config`, { headers: getHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to fetch layout config');
  return json;
};

export const createCategory = async (data) => {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to create category');
  return json;
};

export const updateCategory = async (id, data) => {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to update category');
  return json;
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to delete category');
  return json;
};

export const getTags = async () => {
  const res = await fetch(`${API_BASE}/tags`, { headers: getHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to fetch tags');
  return json;
};

export const createTag = async (data) => {
  const res = await fetch(`${API_BASE}/tags`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to create tag');
  return json;
};

export const updateTag = async (id, data) => {
  const res = await fetch(`${API_BASE}/tags/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to update tag');
  return json;
};

export const deleteTag = async (id) => {
  const res = await fetch(`${API_BASE}/tags/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to delete tag');
  return json;
};

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null) || '';

export const getMediaLibrary = async () => {
  const token = getToken();
  const res = await fetch(`${API_BASE}/media`, {
    headers: {
      'x-tenant-id': resolveTenantId(),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to fetch media library');
  return json;
};

export const uploadMedia = async (file, metadata = {}) => {
  const token = getToken();
  if (!token) throw new Error('Session expired - Please login again');
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.altText) formData.append('altText', metadata.altText);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.caption) formData.append('caption', metadata.caption);
  if (metadata.credits) formData.append('credits', metadata.credits);

  const res = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': resolveTenantId(),
    },
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || 'Failed to upload media');
  return json;
};
