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

  let target = `${origin}/favicon.svg`;

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
        target = url.toString();
      }
    }
  } catch {}

  return new Response(null, {
    status: 302,
    headers: {
      'Location': target,
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=31536000',
    },
  });
}
