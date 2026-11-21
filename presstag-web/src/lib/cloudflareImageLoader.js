const normalizeSrc = (src) => {
  if (!src) return '';
  if (src.startsWith('//')) return `https:${src}`;
  return src;
};

export default function cloudflareImageLoader({ src, width, quality }) {
  const source = normalizeSrc(String(src || ''));
  if (!source) return '';

  const q = quality || 75;
  const enableResizing = process.env.NEXT_PUBLIC_ENABLE_CF_IMAGE_RESIZING === '1';

  // Cloudflare Image Resizing must be enabled on the zone for /cdn-cgi/image to work.
  // Keep a safe passthrough default so deployments without it continue to serve images.
  if (enableResizing) {
    if (source.startsWith('/')) {
      return `/cdn-cgi/image/width=${width},quality=${q},format=auto${source}`;
    }
    try {
      const url = new URL(source);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
      const sameOrigin = siteUrl ? url.origin === new URL(siteUrl).origin : false;
      const allowedHosts = new Set([
        'pub-fc6b0668ad0242ec8180d92255407043.r2.dev',
        'dmpsza32x691.cloudfront.net',
        'sportzpoint.com',
        'www.sportzpoint.com',
      ]);
      if (sameOrigin || allowedHosts.has(url.hostname)) {
        return `/cdn-cgi/image/width=${width},quality=${q},format=auto/${source}`;
      }
    } catch {
      // fall through to passthrough
    }
  }

  return source;
}