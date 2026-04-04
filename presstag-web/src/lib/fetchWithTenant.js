/**
 * web/src/lib/fetchWithTenant.js
 * Utility for tenant-aware API calls from the public frontend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchWithTenant(path, options = {}) {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${cleanPath}`;
  
  const defaultOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': 'sportzpoint', // ✅ Hardcoded for your first client
      ...options.headers,
    },
    // ✅ CRITICAL: 'no-store' ensures admin changes reflect immediately
    cache: options.cache || 'no-store', 
  };

  return fetch(url, defaultOptions);
}

/**
 * Specifically fetches the layout configuration (branding, colors, sections)
 */
export async function fetchLayoutConfig(options = {}) {
  return fetchWithTenant('/layout-config', options);
}

/**
 * Specifically fetches the tenant's general info
 */
export async function fetchTenantInfo(options = {}) {
  return fetchWithTenant('/tenants/sportzpoint', options);
}