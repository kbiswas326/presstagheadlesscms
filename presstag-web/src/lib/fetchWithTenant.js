/**
 * web/src/lib/fetchWithTenant.js
 * Utility for tenant-aware API calls from the public frontend.
 */

const normalizeApiBase = (raw) => {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:5000/api';
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

const API_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

const resolveTenantId = () => {
  const envTenant = String(process.env.NEXT_PUBLIC_TENANT_ID || '').trim();
  if (envTenant) return envTenant;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('sportzpoint')) return 'sportzpoint';
    if (host.includes('presstag')) return 'presstag';
  } else {
    const vercelUrl = String(process.env.VERCEL_URL || '').toLowerCase();
    if (vercelUrl.includes('sportzpoint')) return 'sportzpoint';
    if (vercelUrl.includes('presstag')) return 'presstag';
  }

  return 'presstag';
};

export async function fetchWithTenant(path, options = {}) {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${cleanPath}`;
  
  const defaultOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': resolveTenantId(),
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
  return fetchWithTenant(`/tenants/${resolveTenantId()}`, options);
}
