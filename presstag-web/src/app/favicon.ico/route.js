import { fetchLayoutConfig } from '@/lib/fetchWithTenant';
import { resolveSiteAssetUrl } from '@/lib/seo';

export async function GET(request) {
  try {
    const res = await fetchLayoutConfig();
    if (res.ok) {
      const config = await res.json();
      const updatedAt = config?.updatedAt ? new Date(config.updatedAt).getTime() : '';
      const candidate = resolveSiteAssetUrl(
        config?.branding?.favicon ||
        config?.branding?.logo ||
        '/favicon.svg'
      );

      if (candidate) {
        const url = new URL(candidate, request.url);
        if (updatedAt) url.searchParams.set('v', String(updatedAt));
        return Response.redirect(url.toString(), 302);
      }
    }
  } catch {}

  return Response.redirect(new URL('/favicon.svg', request.url).toString(), 302);
}

