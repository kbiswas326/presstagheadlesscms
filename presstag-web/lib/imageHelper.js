/// Helper functions for handling image URLs and uploads in the Presstag web app. This module provides utilities to resolve image URLs from various formats, upload images to the backend, and fetch fallback images from the layout configuration. The functions ensure that image URLs are correctly formatted and accessible, whether they are absolute URLs or relative paths stored in the backend. The upload function handles file uploads with associated metadata and returns the necessary information for displaying the uploaded image in the app. The fallback image function retrieves a default image from the layout configuration to be used when specific post images are not available. //
export const getImageUrl = (relativePath) => {
  if (!relativePath) return null;

  if (typeof relativePath === 'object' && relativePath !== null) {
    relativePath = relativePath.url || relativePath.src || null;
    if (!relativePath) return null;
  }

  if (
    relativePath.startsWith('http://') ||
    relativePath.startsWith('https://')
  ) {
    return relativePath;
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  return `${API_BASE}${path}`;
};

export const uploadImage = async (file, metadata = {}) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const formData = new FormData();
  formData.append('file', file);

  if (metadata.altText) formData.append('altText', metadata.altText);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.caption) formData.append('caption', metadata.caption);
  if (metadata.credits) formData.append('credits', metadata.credits);

  const response = await fetch(`${API_BASE}/api/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const data = await response.json();

  return {
    url: data.url,
    fullUrl: data.fullUrl || getImageUrl(data.url),
    filename: data.filename,
    _id: data._id,
  };
};

// ✅ FIXED
export async function getFallbackImage() {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    const res = await fetch(`${API_BASE}/api/layout-config`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();

    return getImageUrl(data?.branding?.fallbackImage) || null;
  } catch {
    return null;
  }
}

// ✅ FINAL
export function resolvePostImage(post, fallbackImage = null) {
  const img =
    post?.featuredImage?.url ||
    post?.featuredImage ||
    post?.banner_image ||
    post?.coverImage;

  const resolved = getImageUrl(img);

  if (resolved) return resolved;

  if (fallbackImage) return fallbackImage;

  return null;
}