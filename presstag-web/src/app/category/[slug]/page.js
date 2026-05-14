///web/src/app/category/[slug]/page.js | This page component renders a list of posts for a given category slug. It fetches the posts from the backend API based on the category slug and supports pagination. The page displays the category title, a grid of article cards, and pagination controls. If no posts are found for the category, it shows a message indicating that there are no posts in that category. The component uses React's async/await syntax to handle data fetching and includes error handling to ensure a smooth user experience even if the API call fails.
import React from 'react';
import TemplateListing from '../../../components/TemplateListing';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';
import { buildOpenGraphImage, fillTemplate, resolveSiteAssetUrl } from '../../../lib/seo';
import { resolveTemplateId } from '../../../lib/templates';
import { headers } from 'next/headers';

export const revalidate = 120;

async function getLayoutConfig() {
  try {
    const res = await fetchWithTenant('/layout-config', { next: { revalidate: 60 } });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getCategory(slug) {
  try {
    const res = await fetchWithTenant(`/categories/by-slug/${slug}`, { next: { revalidate: 600 } });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getCategoryPosts(slug, page = 1) {
  if (!slug) return { articles: [], totalPages: 1, total: 0 };

  const limit = 20;

  try {
    const res = await fetchWithTenant(
      `/posts?status=published&excludeType=custompage&category=${encodeURIComponent(String(slug))}&page=${page}&limit=${limit}&lite=1`,
      { next: { revalidate: 120 } }
    );

    if (!res.ok) throw new Error('Failed to fetch category posts');

    const data = await res.json();

    const articles = Array.isArray(data) ? data : (data.posts || []);
    const pagination = data.pagination || {};

    return {
      articles,
      totalPages: pagination.totalPages || Math.ceil(articles.length / limit),
      total: pagination.total || articles.length
    };
  } catch (error) {
    console.error("Error fetching category posts:", error);
    return { articles: [], totalPages: 1, total: 0 };
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const [config, category] = await Promise.all([
    getLayoutConfig(),
    slug ? getCategory(slug) : null,
  ]);

  const siteTitle = config?.branding?.siteTitle || 'PressTag';
  const categoryName = category?.name || (slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Category');

  const title = category?.metaTitle
    || fillTemplate(config?.seo?.categoryMetaTitleTemplate || 'Category: {category} | {site}', { category: categoryName, site: siteTitle });

  const description = category?.metaDescription
    || fillTemplate(config?.seo?.categoryMetaDescriptionTemplate || 'Read the latest {category} news on {site}', { category: categoryName, site: siteTitle });

  const ogImage = resolveSiteAssetUrl(category?.image || config?.seo?.defaultOgImage || config?.branding?.fallbackImage || config?.branding?.logo || '/favicon.ico');

  return {
    title,
    description,
    alternates: {
      canonical: `/category/${encodeURIComponent(String(slug || ''))}`,
    },
    openGraph: {
      title,
      description,
      siteName: siteTitle,
      images: buildOpenGraphImage(ogImage),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    }
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;

  if (!slug) {
    return <div className="container mx-auto px-4 py-8">Invalid category</div>;
  }

  const [config, postsResult] = await Promise.all([
    getLayoutConfig(),
    getCategoryPosts(slug, page),
  ]);
  const { articles: posts, totalPages } = postsResult;
  const h = await headers();
  const templateOverride = h.get('x-template-id');
  const templateId = resolveTemplateId(templateOverride || config?.branding?.templateId);
  const primaryColor = config?.branding?.primaryColor || '#006356';
  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';

  const title = slug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return (
    <TemplateListing
      templateId={templateId}
      heading={
        <>
          Category:{' '}
          <span style={{ color: primaryColor }}>{title}</span>
        </>
      }
      meta={`${posts.length} articles • Page ${page}`}
      posts={posts}
      page={page}
      totalPages={totalPages}
      baseUrl={`/category/${slug}`}
      primaryColor={primaryColor}
      urlStructure={urlStructure}
      sidebar={true}
    />
  );
}
