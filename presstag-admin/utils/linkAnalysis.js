export function countInternalExternalLinks(html, siteUrl) {
  const rawHtml = String(html || '');
  const base = String(siteUrl || '').trim();
  let siteHost = '';

  try {
    if (base) siteHost = new URL(base).host;
  } catch {}

  let doc;
  try {
    doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  } catch {
    return { internal: 0, external: 0 };
  }

  const anchors = Array.from(doc.querySelectorAll('a[href]'));
  let internal = 0;
  let external = 0;

  for (const a of anchors) {
    const hrefRaw = a.getAttribute('href');
    const href = String(hrefRaw || '').trim();
    if (!href) continue;

    const lower = href.toLowerCase();
    if (lower.startsWith('#')) continue;
    if (lower.startsWith('mailto:')) continue;
    if (lower.startsWith('tel:')) continue;
    if (lower.startsWith('javascript:')) continue;

    if (href.startsWith('/')) {
      internal += 1;
      continue;
    }

    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      if (siteHost) {
        try {
          const u = new URL(href);
          if (u.host === siteHost) internal += 1;
          else external += 1;
        } catch {
          external += 1;
        }
      } else {
        external += 1;
      }
      continue;
    }

    internal += 1;
  }

  return { internal, external };
}

