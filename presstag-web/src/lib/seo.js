export function fillTemplate(template, vars = {}) {
  const t = String(template || '');
  if (!t) return '';
  return t.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const v = vars[key];
    if (v === null || v === undefined) return '';
    return String(v);
  }).replace(/\s+/g, ' ').trim();
}

export function resolveSiteAssetUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  if (path.startsWith('/uploads')) {
    const base = String(process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '').replace(/\/api\/?$/, '');
    if (base) return `${base}${path}`;
  }
  return path;
}

export function buildOpenGraphImage(url) {
  const resolved = resolveSiteAssetUrl(url);
  if (!resolved) return undefined;
  return [{ url: resolved }];
}

