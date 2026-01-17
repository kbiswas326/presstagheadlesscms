// lib/imageHelper.js or utils/imageHelper.js
// For Next.js Admin Panel and Web Frontend

/**
 * Converts relative image path to full URL
 * @param {string} relativePath - Path from database (e.g., "/uploads/default/image.jpg")
 * @returns {string} Full URL
 */
export const getImageUrl = (relativePath) => {
  // Handle null/undefined
  if (!relativePath) return null;
  
  // Handle object format (e.g., { url: '...', altText: '...' })
  if (typeof relativePath === 'object' && relativePath.url) {
    relativePath = relativePath.url;
  }
  
  // Ensure it's a string at this point
  if (typeof relativePath !== 'string') return null;
  
  // If already a full URL, fix port compatibility and return
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    // Fix port compatibility: replace localhost:5000 with localhost:5001
    return relativePath.replace('localhost:5000', 'localhost:5001');
  }
  
  // Get API base URL from environment
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  // Ensure no double slashes
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${API_BASE}${path}`;
};

/**
 * Upload image to backend
 * @param {File} file - Image file to upload
 * @param {Object} metadata - Optional metadata (altText, title, caption, credits)
 * @returns {Promise<Object>} Upload response
 */
export const uploadImage = async (file, metadata = {}) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  const formData = new FormData();
  formData.append('file', file);
  
  // Add metadata
  if (metadata.altText) formData.append('altText', metadata.altText);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.caption) formData.append('caption', metadata.caption);
  if (metadata.credits) formData.append('credits', metadata.credits);
  
  const response = await fetch(`${API_BASE}/api/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'x-client-id': localStorage.getItem('clientId') || 'default'
    },
    body: formData
  });
  
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