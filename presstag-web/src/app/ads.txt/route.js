export async function GET(request) {
  const host = String(request.headers.get('host') || '').toLowerCase();
  const tenantId = host.includes('sportzpoint') ? 'sportzpoint' : 'presstag';

  const normalizeApiBase = (raw) => {
    const trimmed = String(raw || '').trim().replace(/\/+$/, '');
    if (!trimmed) return 'http://localhost:5000/api';
    if (trimmed.endsWith('/api')) return trimmed;
    return `${trimmed}/api`;
  };

  const apiBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000');

  let adsTxt = '';
  try {
    const res = await fetch(`${apiBase}/ads-txt`, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      adsTxt = String(data?.adsTxt || '');
    }
  } catch {}

  const body = `${adsTxt.replace(/\r\n/g, '\n').trimEnd()}\n`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
