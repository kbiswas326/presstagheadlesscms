import { NextResponse } from 'next/server';

export function middleware(request) {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'sportzpoint';
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: '/:path*',
};