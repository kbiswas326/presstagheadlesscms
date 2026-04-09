import { fetchLayoutConfig } from '@/lib/fetchWithTenant';
import { resolveSiteAssetUrl } from '@/lib/seo';

export async function GET(request) {
  const origin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return 'http://localhost:3001';
    }
  })();

  try {
    const res = await fetchLayoutConfig({ next: { revalidate: 3600 } });
    if (res.ok) {
      const config = await res.json();
      const updatedAt = config?.updatedAt ? new Date(config.updatedAt).getTime() : '';
      const candidate = resolveSiteAssetUrl(
        config?.branding?.favicon ||
        config?.branding?.logo ||
        '/favicon.svg'
      );

      if (candidate) {
        const url = new URL(candidate, origin);
        if (updatedAt) url.searchParams.set('v', String(updatedAt));

        const upstream = await fetch(url.toString(), { next: { revalidate: 86400 } });
        if (upstream.ok) {
          const buffer = await upstream.arrayBuffer();
          const contentType = upstream.headers.get('content-type') || 'image/x-icon';
          return new Response(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=31536000',
            },
          });
        }
      }
    }
  } catch {}

  const fallbackUrl = new URL('/favicon.svg', origin).toString();
  const upstream = await fetch(fallbackUrl, { next: { revalidate: 86400 } }).catch(() => null);
  if (upstream && upstream.ok) {
    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'image/svg+xml';
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=31536000',
      },
    });
  }

  return new Response('', { status: 204 });
}
