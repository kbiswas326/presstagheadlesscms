export const normalizeRole = (raw) => {
  const role = String(raw || '').toLowerCase().trim();
  if (role === 'admin' || role === 'editor' || role === 'writer') return role;
  if (role === 'author') return 'writer';
  return 'writer';
};

export const canAccessSettings = (role) => normalizeRole(role) === 'admin';

export const canManageUsers = (role) => normalizeRole(role) === 'admin';

export const canDeletePost = (role) => {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'editor';
};

export const canPublishPost = (role) => {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'editor';
};

export const isPostOwnedByUser = (post, userId) => {
  const uid = String(userId || '');
  if (!uid) return false;
  const author = post?.author && typeof post.author === 'object' ? (post.author._id || post.author.id) : post?.author;
  const primaryAuthor = post?.primaryAuthor && typeof post.primaryAuthor === 'object' ? (post.primaryAuthor._id || post.primaryAuthor.id) : post?.primaryAuthor;
  if (author != null && String(author) === uid) return true;
  if (primaryAuthor != null && String(primaryAuthor) === uid) return true;
  const authors = Array.isArray(post?.authors) ? post.authors : [];
  return authors.some((a) => {
    const id = a && typeof a === 'object' ? (a._id || a.id) : a;
    return id != null && String(id) === uid;
  });
};

export const canEditPost = (role, post, userId) => {
  const r = normalizeRole(role);
  if (r === 'admin' || r === 'editor') return true;
  return isPostOwnedByUser(post, userId);
};

