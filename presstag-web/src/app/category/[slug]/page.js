///web/src/app/category/[slug]/page.js | This page component renders a list of posts for a given category slug. It fetches the posts from the backend API based on the category slug and supports pagination. The page displays the category title, a grid of article cards, and pagination controls. If no posts are found for the category, it shows a message indicating that there are no posts in that category. The component uses React's async/await syntax to handle data fetching and includes error handling to ensure a smooth user experience even if the API call fails.
import React from 'react';
import ArticleGridCard from '../../../components/ArticleGridCard';
import Pagination from '../../../components/Pagination';
import { fetchWithTenant } from '../../../lib/fetchWithTenant';

async function getCategoryPosts(slug, page = 1) {
  if (!slug) return { articles: [], totalPages: 0 };
  const limit = 20;
  try {
    const res = await fetchWithTenant(`/api/posts?category=${slug}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch posts');
    const data = await res.json();
    let articles = [];
    let totalPages = 1;
    if (Array.isArray(data)) {
      const totalCount = data.length;
      totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      articles = data.slice(startIndex, startIndex + limit);
    } else if (data.articles && Array.isArray(data.articles)) {
      articles = data.articles;
      const totalCount = data.Count || data.total || 0;
      if (totalCount > 0) totalPages = Math.ceil(totalCount / limit);
      else if (data.pagination?.totalPages) totalPages = data.pagination.totalPages;
    }
    return { articles, totalPages };
  } catch (error) {
    console.error("Error fetching category posts:", error);
    return { articles: [], totalPages: 0 };
  }
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
  
  // Format title from slug
  const title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Category: <span className="text-emerald-600">{title}</span>
        </h1>
      </div>
      
      {posts.length > 0 ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <ArticleGridCard key={i} post={post} />
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