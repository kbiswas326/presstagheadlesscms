
import React from "react";
import FeaturedHero from "../components/FeaturedHero";
import HorizontalCard from "../components/HorizontalCard";
import ArticleGridCard from "../components/ArticleGridCard";
import Sidebar from "../components/Sidebar";
import ResponsivePostGrid from "../components/ResponsivePostGrid";

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';

async function getLayoutConfig() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/layout-config`, { cache: 'no-store' });
    if(res.ok) return res.json();
  } catch(e) { console.error(e); }
  return null;
}

async function getPosts(params = {}) {
    const { type = 'latest', value, limit = 10 } = params;
    let url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/posts?status=published&limit=' + limit;
    
    if (type === 'category' && value) {
        url += '&category=' + value;
    } else if (type === 'tag' && value) {
        url += '&tag=' + value;
    } else if (type === 'author' && value) {
        url += '&author=' + value;
    } else if ((type === 'content_type' || type === 'type') && value) {
        url += '&type=' + value;
    } else if (type === 'trending') {
         // Assuming backend supports sort=trending or similar
         // For now, we can perhaps use sorting by views if available, or just latest
         // url += '&sort=trending'; 
    }
    
    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.articles || []);
    } catch (e) { return []; }
}

export default async function Page() {
    const config = await getLayoutConfig();
    const primaryColor = config?.branding?.primaryColor || '#006356';
    
    // 1. Fetch Hero Data (Always Latest for now, or could be configured)
    const heroPosts = await getPosts({ limit: 5 }); 
    const featuredPost = heroPosts[0];
    const sidePosts = heroPosts.slice(1, 5);

    // 2. Fetch Dynamic Sections
    let sectionsData = [];
    
    if (config?.homepage?.sections) {
        const sectionsPromise = config.homepage.sections
            .filter(section => section.enabled)
            .sort((a, b) => a.order - b.order)
            .map(async (section) => {
                let posts = [];
                const limit = section.limit || 12; // Default to 12 as requested
                let viewAllUrl = null;
                
                if (section.type === 'system') {
                    if (section.id === 'latest') {
                        posts = await getPosts({ limit });
                        viewAllUrl = '/posts';
                    } else if (section.id === 'trending') {
                        // If no specific trending endpoint, reuse latest for now or implement trending logic
                         posts = await getPosts({ limit }); 
                         viewAllUrl = '/posts?sort=trending';
                    }
                } else if (section.type === 'custom') {
                    posts = await getPosts({ 
                        type: section.sourceType, 
                        value: section.sourceValue, 
                        limit 
                    });
                    
                    if (section.sourceType === 'category') viewAllUrl = `/category/${section.sourceValue}`;
                    else if (section.sourceType === 'tag') viewAllUrl = `/tag/${section.sourceValue}`;
                    else if (section.sourceType === 'author') viewAllUrl = `/author/${section.sourceValue}`;
                }
                
                return {
                    ...section,
                    posts,
                    viewAllUrl
                };
            });
            
        sectionsData = await Promise.all(sectionsPromise);
    } else {
        // Fallback if no config
        const latestNews = await getPosts({ limit: 12 });
        sectionsData = [
            { name: 'Latest News', posts: latestNews, viewAllUrl: '/posts' }
        ];
    }

    return (
        <div className="bg-white min-h-screen pb-16">
            <div className="container mx-auto px-4 pt-6">
                
                {/* HERO SECTION */}
                {featuredPost && (
                    <section className="mb-12">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            <div className="lg:col-span-2">
                               <FeaturedHero post={featuredPost} />
                            </div>
                            <div className="lg:col-span-1 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 
                                        className="text-lg font-bold text-gray-900 border-l-4 pl-3"
                                        style={{ borderColor: primaryColor }}
                                    >
                                        Top Stories
                                    </h2>
                                </div>
                                <div className="flex flex-col gap-4 flex-grow">
                                    {sidePosts.map((post, i) => (
                                        <HorizontalCard key={i} post={post} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8">
                        
                        {/* DYNAMIC SECTIONS */}
                        {sectionsData.map((section, index) => (
                            <ResponsivePostGrid 
                                key={index} 
                                posts={section.posts} 
                                sectionName={section.name} 
                                primaryColor={primaryColor}
                                viewAllUrl={section.viewAllUrl}
                            />
                        ))}

                    </div>
                    
                    {/* SIDEBAR */}
                    <div className="lg:col-span-4">
                        <Sidebar />
                    </div>
                </div>
            </div>
        </div>
    );
}
