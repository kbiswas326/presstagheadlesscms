/**
 * admin/utils/getEditPath.js
 * Determines the correct internal route for editing different post types.
 */

export function getEditPath(post) {
  if (!post) return null;
  
  // Normalize the type for comparison
  const type = post.type?.toLowerCase().trim() || 'article';
  const id = post._id || post.id;

  if (!id) return null;

  switch (type) {
    case 'video':
      return `/posts/video/edit/${id}`;
    
    case 'photo-gallery':
    case 'gallery':
    case 'photo gallery':
      return `/posts/photo-gallery/edit/${id}`;
    
    case 'web-story':
    case 'web story':
    case 'story':
      return `/posts/web-story/edit/${id}`;
    
    case 'live-blog':
    case 'live blog':
    case 'liveblog':
      return `/posts/live-blog/edit/${id}`;
    
    case 'article':
    default:
      // Default to the standard article editor
      return `/posts/article/edit/${id}`;
  }
}