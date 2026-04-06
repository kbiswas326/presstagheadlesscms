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

async function getTag(slug) {
  try {
    const res = await fetchWithTenant(`/tags/by-slug/${slug}`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

async function getTagPosts(slug, page = 1) {
  if (!slug) return { articles: [], totalPages: 0 };
  const limit = 20;
  try {
    const res = await fetchWithTenant(`/posts?tag=${slug}&page=${page}&limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch posts');
    }
    const data = await res.json();
    
    let articles = [];
    let totalPages = 1;
    
    if (Array.isArray(data)) {
        const totalCount = data.length;
        totalPages = Math.ceil(totalCount / limit);
        
        // Slice the array for the current page
        const startIndex = (page - 1) * limit;
        articles = data.slice(startIndex, startIndex + limit);
        
    } else if (data.posts && Array.isArray(data.posts)) {
        articles = data.posts;
        totalPages = data.pagination?.totalPages || Math.ceil((data.pagination?.total || articles.length) / limit);
    }
    
    return { articles, totalPages };
  } catch (error) {
    console.error("Error fetching tag posts:", error);
    return { articles: [], totalPages: 0 };
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const [config, tag] = await Promise.all([
    getLayoutConfig(),
    slug ? getTag(slug) : null,
  ]);

  const siteTitle = config?.branding?.siteTitle || 'PressTag';
  const tagName = tag?.name || (slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Tag');

  const title = tag?.metaTitle
    || fillTemplate(config?.seo?.tagMetaTitleTemplate || 'Tag: {tag} | {site}', { tag: tagName, site: siteTitle });

  const description = tag?.metaDescription
    || fillTemplate(config?.seo?.tagMetaDescriptionTemplate || 'Read posts tagged {tag} on {site}', { tag: tagName, site: siteTitle });

  const ogImage = resolveSiteAssetUrl(tag?.image || config?.seo?.defaultOgImage || config?.branding?.fallbackImage || config?.branding?.logo || '/favicon.ico');

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
