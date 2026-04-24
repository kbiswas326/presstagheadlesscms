import { NextResponse } from 'next/server';

const normalizeApiBase = (raw) => {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:5000/api';
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

const API_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

let cachedRedirects = {
  fetchedAt: 0,
  tenantId: null,
  items: [],
};

function normalizePath(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      return new URL(raw).pathname || '';
    } catch {
      return raw;
    }
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}

async function loadRedirects(tenantId) {
  const now = Date.now();
  if (cachedRedirects.tenantId === tenantId && now - cachedRedirects.fetchedAt < 60_000) {
    return cachedRedirects.items;
  }

  try {
    const res = await fetch(`${API_URL}/layout-config`, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to load layout config');
    const config = await res.json();
    const redirects = Array.isArray(config?.seo?.redirects) ? config.seo.redirects : [];
    const normalized = redirects
      .map((r) => ({
        from: normalizePath(r?.from),
        to: String(r?.to || '').trim(),
        permanent: r?.permanent !== false,
      }))
      .filter((r) => r.from && r.to);

    cachedRedirects = {
      fetchedAt: now,
      tenantId,
      items: normalized,
    };
    return normalized;
  } catch {
    cachedRedirects = {
      fetchedAt: now,
      tenantId,
      items: [],
    };
    return [];
  }
}

export async function middleware(request) {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'sportzpoint';

  const pathname = request.nextUrl.pathname;
  const rules = await loadRedirects(tenantId);
  const match = rules.find((r) => r.from === pathname || (r.from.endsWith('/') && r.from.slice(0, -1) === pathname));
  if (match) {
    const base = new URL(request.url);
    const toRaw = String(match.to || '').trim();
    const target = new URL(toRaw, base);
    const shouldPreserveQuery = !toRaw.includes('?') && base.search;
    if (shouldPreserveQuery) target.search = base.search;
    if (target.pathname !== base.pathname || target.search !== base.search) {
      return NextResponse.redirect(target, { status: match.permanent ? 301 : 302 });
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: '/:path*',
};
