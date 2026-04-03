/// web/src/lib/fetchWithTenant.js | This file provides utility functions for making API requests that include tenant information. It constructs the API URL by appending the tenant ID as a query parameter, allowing the backend to identify which tenant's data to access. The `fetchWithTenant` function is a wrapper around the standard `fetch` API, ensuring that all requests made using this function will include the tenant information automatically. This is essential for multi-tenant applications where different tenants share the same backend but need to access their own data securely.
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'sportzpoint';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function tenantUrl(path) {
  return `${API_BASE}${path}`;
}

export function fetchWithTenant(path, options = {}) {
  const headers = {
    ...options.headers,
    'x-tenant-id': TENANT_ID,
  };
  return fetch(tenantUrl(path), { ...options, headers });
}

export function fetchLayoutConfig() {
  return fetch(tenantUrl('/api/layout-config'), { 
    headers: { 'x-tenant-id': TENANT_ID },
    next: { revalidate: 300 } // cache 5 minutes
  });
}