// lib/imageHelper.js or utils/imageHelper.js
// For Next.js Admin Panel and Web Frontend

/**
 * Converts relative image path to full URL
 * @param {string} relativePath - Path from database (e.g., "/uploads/default/image.jpg")
 * @returns {string} Full URL
 */
export const getImageUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // If already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Get API base URL from environment
  const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/api$/, '');
  
  // Ensure no double slashes
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${API_ORIGIN}${path}`;
};

const normalizeApiBase = (raw) => {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:5001/api';
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

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

/**
 * Upload image to backend
 * @param {File} file - Image file to upload
 * @param {Object} metadata - Optional metadata (altText, title, caption, credits)
 * @returns {Promise<Object>} Upload response
 */
export const uploadImage = async (file, metadata = {}) => {
  const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');
  
  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata
  if (metadata.altText) formData.append('altText', metadata.altText);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.caption) formData.append('caption', metadata.caption);
  if (metadata.credits) formData.append('credits', metadata.credits);
  
  let token = localStorage.getItem('token');
  
  // Validate token
  if (!token || token === 'undefined' || token === 'null' || typeof token !== 'string' || token.length === 0) {
    console.error('❌ No valid token in localStorage');
    throw new Error('Session expired - Please login again');
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': resolveTenantId(),
  };
  
  let response = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers: headers,
    body: formData
  });
  
  // Handle 401 with token refresh
  if (!response.ok && response.status === 401) {
    console.log('🔄 Upload got 401, attempting token refresh...');
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': resolveTenantId(),
        }
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.token) {
          console.log('✅ Token refreshed, retrying upload...');
          localStorage.setItem('token', refreshData.token);
          token = refreshData.token;

          // Rebuild FormData and headers for retry
          const retryFormData = new FormData();
          retryFormData.append('file', file);
          if (metadata.altText) retryFormData.append('altText', metadata.altText);
          if (metadata.title) retryFormData.append('title', metadata.title);
          if (metadata.caption) retryFormData.append('caption', metadata.caption);
          if (metadata.credits) retryFormData.append('credits', metadata.credits);

          response = await fetch(`${API_BASE}/media/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': resolveTenantId() },
            body: retryFormData
          });
        }
      } else {
        console.error('❌ Token refresh failed:', refreshRes.status);
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
    }
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }
  
  const data = await response.json();
  
  return {
    url: data.url,        // Relative path - STORE THIS in database
    fullUrl: data.fullUrl || getImageUrl(data.url), // Full URL for display
    filename: data.filename,
    _id: data._id
  };
};

// Usage Examples:
// 
// 1. Display image from database
// import { getImageUrl } from '@/lib/imageHelper';
// const post = { featuredImage: "/uploads/default/image.jpg" };
// <img src={getImageUrl(post.featuredImage)} alt="Post" />
// 
// 2. Upload new image
// import { uploadImage } from '@/lib/imageHelper';
// const handleUpload = async (file) => {
//   try {
//     const result = await uploadImage(file, {
//       altText: 'My image',
//       title: 'Sample'
//     });
//     // Save result.url to database (relative path)
//     setPost({ ...post, featuredImage: result.url });
//   } catch (error) {
//     console.error('Upload failed:', error);
//   }
// };
