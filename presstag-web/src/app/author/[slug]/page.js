
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArticleGridCard from '@/components/ArticleGridCard';
import Pagination from '@/components/Pagination';
import { fetchWithTenant } from '@/lib/fetchWithTenant';
import { getImageUrl } from '@/lib/imageHelper';

async function getAuthor(slug) {
    try {
        const res = await fetchWithTenant(`/users/public/${slug}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching author:', error);
        return null;
    }
}

async function getAuthorPosts(authorId, page = 1) {
    try {
        const res = await fetchWithTenant(`/posts?author=${authorId}&limit=20&page=${page}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch posts');
        const data = await res.json();
        
        let articles = [];
        let totalPages = 1;
        let totalCount = 0;

        if (Array.isArray(data)) {
            articles = data;
            // Client-side pagination logic if API returns all
             totalCount = articles.length;
             totalPages = Math.ceil(totalCount / 20);
             const startIndex = (page - 1) * 20;
             articles = articles.slice(startIndex, startIndex + 20);
        } else if (data.posts && Array.isArray(data.posts)) {
            articles = data.posts;
             if (data.pagination) {
                totalPages = data.pagination.totalPages;
            } else if (data.Count) {
                 totalCount = data.Count;
                 totalPages = Math.ceil(totalCount / 20);
            }
        }
        
        return { articles, totalPages };
    } catch (error) {
        console.error('Error fetching author posts:', error);
        return { articles: [], totalPages: 0 };
    }
}

export default async function AuthorPage({ params, searchParams }) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams.page) || 1;
    const authorSlug = resolvedParams.slug; // Renamed from id to slug

    const author = await getAuthor(authorSlug);

    if (!author) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Author Not Found</h1>
            </div>
        );
    }

    // Now fetch posts using the Author ID we got from the author object
    const { articles, totalPages } = await getAuthorPosts(author._id, page);

    // Image logic
    const authorImageSrc = getImageUrl(author.image);

    return (
        <div className="bg-white min-h-screen pb-16">
            {/* Author Header */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden relative mb-6 border-4 border-white shadow-md bg-gray-200">
                         {authorImageSrc ? (
                            <Image 
                                src={authorImageSrc} 
                                alt={author.name} 
                                fill 
                                className="object-cover"
                            />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                             </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{author.name}</h1>
                    {author.role && (
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full uppercase font-semibold tracking-wide mb-4">
                            {author.role}
                        </span>
                    )}
                    {author.bio && (
                        <p className="text-gray-600 max-w-2xl mx-auto mb-6 text-lg leading-relaxed">
                            {author.bio}
                        </p>
                    )}
                     {author.email && (
                        <a href={`mailto:${author.email}`} className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {author.email}
                        </a>
                    )}
                </div>
            </div>

            {/* Posts Grid */}
            <div className="container mx-auto px-4 py-12">
                 <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-2 h-8 bg-emerald-600 rounded-full"></span>
                        Stories by {author.name}
                    </h2>
                    <span className="text-gray-500 text-sm font-medium">
                        Page {page} of {totalPages}
                    </span>
                </div>

                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((post, i) => (
                            <ArticleGridCard key={i} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        No stories found for this author.
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12">
                        <Pagination 
                            currentPage={page} 
                            totalPages={totalPages} 
                            baseUrl={`/author/${authorSlug}`} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
