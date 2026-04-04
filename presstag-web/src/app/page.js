import React from "react";
import FeaturedHero from "../components/FeaturedHero";
import HorizontalCard from "../components/HorizontalCard";
import Sidebar from "../components/Sidebar";
import ResponsivePostGrid from "../components/ResponsivePostGrid";
import { getFallbackImage, resolvePostImage } from '../lib/imageHelper';
import { fetchWithTenant, fetchLayoutConfig } from '../lib/fetchWithTenant';

// Force dynamic rendering to ensure admin changes reflect immediately
export const dynamic = 'force-dynamic';

/**
 * Fetches the layout configuration (branding, colors, sections) for the tenant.
 * Uses 'no-store' to bypass Next.js cache for real-time updates.
 */
async function getLayoutConfig() {
  try {
    const res = await fetchLayoutConfig({ cache: 'no-store' });
    if (res.ok) return res.json();
  } catch (e) { 
    console.error("❌ Layout Config Fetch Error:", e); 
  }
  return null;
}

/**
 * Fetches published posts from the backend.
 */
async function getPosts(params = {}) {
  const { limit = 10, type = 'latest' } = params;
  let path = `/posts?status=published&limit=${limit}`;
  
  if (type === 'trending') path += '&sort=trending';

  try {
    // ✅ FIXED: Using fetchWithTenant with no-cache
    const res = await fetchWithTenant(path, { cache: 'no-store' }); 
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.posts || [];
  } catch (e) { 
    console.error("❌ Posts Fetch Error:", e);
    return []; 
  }
}

export default async function Page() {
  // 1. Load Configuration & Assets
  const config = await getLayoutConfig();
  const fallbackImage = await getFallbackImage();

  // 2. Extract Branding from Admin Settings
  const primaryColor = config?.branding?.primaryColor || '#e11d48'; // Default SportzPoint Red
  const siteName = config?.branding?.navbarTitle || 'SportzPoint';

  // 3. Fetch Content
  const posts = await getPosts({ limit: 15 });
  const featuredPost = posts[0];
  const sidePosts = posts.slice(1, 5);
  const gridPosts = posts.slice(5);

  // 4. Render
  if (!featuredPost && !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest">Loading {siteName}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20 font-sans" style={{ '--primary': primaryColor }}>
      <div className="container mx-auto px-4 pt-8">

        {/* --- HERO SECTION --- */}
        {featuredPost && (
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Featured Post */}
              <div className="lg:col-span-8">
                <FeaturedHero
                  post={{
                    ...featuredPost,
                    image: resolvePostImage(featuredPost, fallbackImage)
                  }}
                  primaryColor={primaryColor}
                />
              </div>

              {/* Side Trending List */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight border-l-4 pl-4" style={{ borderColor: primaryColor }}>
                    Top Stories
                  </h2>
                </div>
                <div className="space-y-6">
                  {sidePosts.map((post, i) => (
                    <HorizontalCard
                      key={i}
                      post={{
                        ...post,
                        image: resolvePostImage(post, fallbackImage)
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Feed */}
          <div className="lg:col-span-8">
            <ResponsivePostGrid
              posts={gridPosts.map(post => ({
                ...post,
                image: resolvePostImage(post, fallbackImage)
              }))}
              sectionName="Latest News"
              primaryColor={primaryColor}
              viewAllUrl="/posts"
            />
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <Sidebar primaryColor={primaryColor} />
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}