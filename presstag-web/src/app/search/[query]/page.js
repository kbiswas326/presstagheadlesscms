import React from 'react';
import ArticleGridCard from '../../../components/ArticleGridCard';
import Pagination from '../../../components/Pagination';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';

export const revalidate = 60;

async function getLayoutConfig() {
  try {
    const res = await fetchWithTenant('/layout-config', { next: { revalidate: 300 } });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function searchPosts(query, page = 1) {
  const limit = 20;
  try {
    const res = await fetchWithTenant(
      `/posts?status=published&search=${encodeURIComponent(String(query || ''))}&page=${page}&limit=${limit}&lite=1`,
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
  const query = resolvedParams?.query ? String(resolvedParams.query) : '';
  const page = Number(resolvedSearchParams?.page) || 1;

  const [config, result] = await Promise.all([
    getLayoutConfig(),
    searchPosts(query, page),
  ]);

  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';
  const baseUrl = `/search/${encodeURIComponent(query)}`;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Search: <span className="text-emerald-600">{query}</span>
        </h1>
        <p className="text-gray-500 mt-1">
          {result.total} results • Page {page}
        </p>
      </div>

      {result.posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.posts.map((post, i) => (
              <ArticleGridCard key={post._id || i} post={post} urlStructure={urlStructure} />
            ))}
          </div>

          <Pagination currentPage={page} totalPages={result.totalPages} baseUrl={baseUrl} />
        </>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-xl text-gray-500">No results found.</h2>
        </div>
      )}
    </div>
  );
}

