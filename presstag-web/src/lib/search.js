export function searchQueryToSlug(query) {
  const slug = String(query || '').trim().toLowerCase().replace(/\s+/g, '-');
  return encodeURIComponent(slug);
}

export function searchSlugToQuery(slug) {
  return String(slug || '').replace(/-/g, ' ');
}
