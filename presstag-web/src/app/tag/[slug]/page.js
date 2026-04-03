import React from 'react';
import ArticleGridCard from '../../../components/ArticleGridCard';
import Pagination from '../../../components/Pagination';

async function getTagPosts(slug, page = 1) {
  if (!slug) return { articles: [], totalPages: 0 };
  const limit = 20;
  try {
    // API ignores limit for tags, returning all posts. We handle pagination client-side.
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts?tag=${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      throw new Error('Failed to fetch posts');
    }
    const data = await res.json();
    
    let articles = [];
    let totalPages = 1;
    
    if (Array.isArray(data)) {
        // API returns all posts as an array
        const totalCount = data.length;
        totalPages = Math.ceil(totalCount / limit);
        
        // Slice the array for the current page
        const startIndex = (page - 1) * limit;
        articles = data.slice(startIndex, startIndex + limit);
        
    } else if (data.posts && Array.isArray(data.posts)) {
        // Fallback for standard pagination structure
        articles = data.posts;
        const totalCount = data.Count || data.total || 0;
        if (totalCount > 0) {
            totalPages = Math.ceil(totalCount / limit);
        } else if (data.pagination && data.pagination.totalPages) {
            totalPages = data.pagination.totalPages;
        }
    }
    
    return { articles, totalPages };
  } catch (error) {
    console.error("Error fetching tag posts:", error);
    return { articles: [], totalPages: 0 };
  }
}

export default async function TagPage({ params, searchParams }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  
  if (!slug) {
    return <div className="container mx-auto px-4 py-8">Invalid tag</div>;
  }

  const { articles: posts, totalPages } = await getTagPosts(slug, page);
  
  // Format title from slug
  const title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Tag: <span className="text-emerald-600">{title}</span>
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
                baseUrl={`/tag/${slug}`} 
            />
        </>
      ) : (
        <div className="text-center py-20">
            <h2 className="text-xl text-gray-500">No posts found for this tag.</h2>
        </div>
      )}
    </div>
  );
}