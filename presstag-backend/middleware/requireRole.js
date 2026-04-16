const normalizeRole = (raw) => {
  const role = String(raw || '').toLowerCase().trim();
  if (role === 'admin' || role === 'editor' || role === 'writer') return role;
  if (role === 'author') return 'writer';
  return 'writer';
};

const requireRole = (roles = []) => {
  const allowed = Array.isArray(roles) ? roles.map(normalizeRole) : [normalizeRole(roles)];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role = normalizeRole(req.user.role);
    if (!allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
};

module.exports = { requireRole, normalizeRole };
