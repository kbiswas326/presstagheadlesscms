///web/src/app/category/[slug]/page.js | This page component renders a list of posts for a given category slug. It fetches the posts from the backend API based on the category slug and supports pagination. The page displays the category title, a grid of article cards, and pagination controls. If no posts are found for the category, it shows a message indicating that there are no posts in that category. The component uses React's async/await syntax to handle data fetching and includes error handling to ensure a smooth user experience even if the API call fails.
import React from 'react';
import ArticleGridCard from '../../../components/ArticleGridCard';
import Pagination from '../../../components/Pagination';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';
import { buildOpenGraphImage, fillTemplate, resolveSiteAssetUrl } from '../../../lib/seo';

async function getLayoutConfig() {
  try {
    const res = await fetchWithTenant('/layout-config', { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getCategory(slug) {
  try {
    const res = await fetchWithTenant(`/categories/by-slug/${slug}`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getCategoryPosts(slug, page = 1) {
  if (!slug) return { articles: [], totalPages: 1, total: 0 };

  const limit = 20;

  try {
    const res = await fetchWithTenant(
      `/posts?category=${slug}&page=${page}&limit=${limit}`,
      { cache: 'no-store' }
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

  const { articles: posts, totalPages } = await getCategoryPosts(slug, page);

  const title = slug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Category: <span className="text-emerald-600">{title}</span>
        </h1>
        <p className="text-gray-500 mt-1">
          {posts.length} articles • Page {page}
        </p>
      </div>
      
      {posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <ArticleGridCard key={post._id || i} post={post} />
            ))}
          </div>
          
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            baseUrl={`/category/${slug}`} 
          />
        </>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-xl text-gray-500">No posts found in this category.</h2>
        </div>
      )}
    </div>
  );
}
