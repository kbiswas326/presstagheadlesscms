import React from 'react';
import ArticleGridCard from '../../components/ArticleGridCard';
import Pagination from '../../components/Pagination';
import { fetchWithTenant } from '../../lib/fetchWithTenant';

export const revalidate = 120;

async function getLayoutConfig() {
  try {
    const res = await fetchWithTenant('/layout-config', { next: { revalidate: 300 } });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getArchivePosts({ page = 1, limit = 24, sort, type, category, tag, author, search }) {
  try {
    const params = new URLSearchParams();
    params.set('status', 'published');
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('lite', '1');
    if (sort) params.set('sort', String(sort));
    if (type) params.set('type', String(type));
    if (category) params.set('category', String(category));
    if (tag) params.set('tag', String(tag));
    if (author) params.set('author', String(author));
    if (search) params.set('search', String(search));

    const res = await fetchWithTenant(`/posts?${params.toString()}`, { next: { revalidate: 120 } });
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

export default async function PostsArchivePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const sort = resolvedSearchParams?.sort ? String(resolvedSearchParams.sort) : '';
  const type = resolvedSearchParams?.type ? String(resolvedSearchParams.type) : '';
  const category = resolvedSearchParams?.category ? String(resolvedSearchParams.category) : '';
  const tag = resolvedSearchParams?.tag ? String(resolvedSearchParams.tag) : '';
  const author = resolvedSearchParams?.author ? String(resolvedSearchParams.author) : '';
  const search = resolvedSearchParams?.search ? String(resolvedSearchParams.search) : '';

  const [config, result] = await Promise.all([
    getLayoutConfig(),
    getArchivePosts({ page, sort, type, category, tag, author, search }),
  ]);

  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';

  const title =
    sort === 'trending'
      ? 'Trending Posts'
      : 'All Posts';

  const baseParams = new URLSearchParams();
  if (sort) baseParams.set('sort', sort);
  if (type) baseParams.set('type', type);
  if (category) baseParams.set('category', category);
  if (tag) baseParams.set('tag', tag);
  if (author) baseParams.set('author', author);
  if (search) baseParams.set('search', search);
  const baseUrl = baseParams.toString() ? `/posts?${baseParams.toString()}` : '/posts';

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 mt-1">
          {result.total} posts • Page {page}
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
          <h2 className="text-xl text-gray-500">No posts found.</h2>
        </div>
      )}
    </div>
  );
}

