import React from 'react';
import TemplateListing from '../../../components/TemplateListing';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';
import { resolveTemplateId } from '../../../lib/templates';
import { headers } from 'next/headers';

export const revalidate = 60;

async function getLayoutConfig() {
  try {
    const res = await fetchWithTenant('/layout-config', { next: { revalidate: 60 } });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function searchPosts(query, page = 1) {
  const limit = 20;
  try {
    const res = await fetchWithTenant(
      `/posts?status=published&excludeType=custompage&search=${encodeURIComponent(String(query || ''))}&page=${page}&limit=${limit}&lite=1`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return { posts: [], totalPages: 1, total: 0 };
    const data = await res.json();
    const posts = Array.isArray(data) ? data : (data.posts || []);
    const pagination = data.pagination || {};
    return {
      posts,
      totalPages: pagination.totalPages || 1,
      total: pagination.total || posts.length,
    };
  } catch {
    return { posts: [], totalPages: 1, total: 0 };
  }
}

export default async function SearchResultsPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawQuery = resolvedParams?.query ? String(resolvedParams.query) : '';
  const query = (() => {
    const q = rawQuery.replace(/\+/g, ' ');
    try {
      return decodeURIComponent(q);
    } catch {
      return q;
    }
  })();
  const page = Number(resolvedSearchParams?.page) || 1;

  const [config, result] = await Promise.all([
    getLayoutConfig(),
    searchPosts(query, page),
  ]);

  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  const templateOverride = headers().get('x-template-id');
  const templateId = resolveTemplateId(templateOverride || config?.branding?.templateId);
  const primaryColor = config?.branding?.primaryColor || '#006356';
  const baseUrl = `/search/${encodeURIComponent(query)}`;

  return (
    <TemplateListing
      templateId={templateId}
      heading={
        <>
          Search:{' '}
          <span style={{ color: primaryColor }}>{query}</span>
        </>
      }
      meta={`${result.total} results • Page ${page}`}
      posts={result.posts}
      page={page}
      totalPages={result.totalPages}
      baseUrl={baseUrl}
      primaryColor={primaryColor}
      urlStructure={urlStructure}
      sidebar={true}
    />
  );
}

