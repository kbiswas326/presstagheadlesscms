import React from 'react';
import TemplateListing from '../../components/TemplateListing';
import { fetchWithTenant } from '../../lib/fetchWithTenant';
import { resolveTemplateId } from '../../lib/templates';

export const revalidate = 120;

async function getLayoutConfig() {
  try {
    const res = await fetchWithTenant('/layout-config', { next: { revalidate: 60 } });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getArchivePosts({ page = 1, limit = 24, sort, type, category, tag, author, search }) {
  try {
    const params = new URLSearchParams();
    params.set('status', 'published');
    params.set('excludeType', 'custompage');
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
  const templateId = resolveTemplateId(config?.branding?.templateId);
  const primaryColor = config?.branding?.primaryColor || '#006356';

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
    <TemplateListing
      templateId={templateId}
      heading={title}
      meta={`${result.total} posts • Page ${page}`}
      posts={result.posts}
      page={page}
      totalPages={result.totalPages}
      baseUrl={baseUrl}
      primaryColor={primaryColor}
      urlStructure={urlStructure}
      sidebar={templateId !== 'classic'}
    />
  );
}

