/// web> src> app> page.js | Main homepage component for the Presstag web app. This component fetches the layout configuration and posts from the backend API to dynamically render the homepage sections based on the admin-defined settings. It includes a hero section with featured posts, followed by multiple sections that can be customized to display posts from specific categories, tags, authors, or content types. The component also handles fallback images for posts that do not have a specific image set, ensuring a consistent visual experience. The sidebar is included for additional widgets and content as defined in the layout configuration. //
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
 * Uses 'no-store' to ensure real-time updates from the admin dashboard.
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
 * Fetches posts based on specific criteria (category, tag, latest, etc.)
 */
async function getPosts(params = {}) {
  const { type = 'latest', value, limit = 10 } = params;
  
  // Construct query path
  let path = `/posts?status=published&limit=${limit}`;
  
  if (type === 'category' && value) path += `&category=${value}`;
  else if (type === 'tag' && value) path += `&tag=${value}`;
  else if (type === 'author' && value) path += `&author=${value}`;
  else if ((type === 'content_type' || type === 'type') && value) path += `&type=${value}`;
  else if (type === 'trending') path += `&sort=trending`;

  try {
    // FIXED: Using fetchWithTenant with no-cache to see admin changes instantly
    const res = await fetchWithTenant(path, { cache: 'no-store' }); 
    if (!res.ok) return [];
    
    const data = await res.json();
    // Backend returns { posts: [], pagination: {} }
    return data.posts || [];
  } catch (e) { 
    console.error(`❌ Posts Fetch Error (${type}):`, e);
    return []; 
  }
}

export default async function Page() {
  // 1. Load Configuration & Assets
  const config = await getLayoutConfig();
  const fallbackImage = await getFallbackImage();

  // 2. Extract Branding
  const primaryColor = config?.branding?.primaryColor || '#e11d48'; // SportzPoint Red
  const siteName = config?.branding?.navbarTitle || 'SportzPoint';
  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';

  // 3. Fetch Hero Section Data (Latest 5)
  const heroPosts = await getPosts({ limit: 5 });
  const featuredPost = heroPosts[0];
  const sidePosts = heroPosts.slice(1, 5);

  // 4. Process Dynamic Sections from Admin
  let sectionsData = [];

  if (config?.homepage?.sections && config.homepage.sections.length > 0) {
    const sectionsPromise = config.homepage.sections
      .filter(section => section.enabled)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(async (section) => {
        const limit = section.limit || 8;
        let posts = [];
        let viewAllUrl = "#";

        if (section.type === 'system') {
          posts = await getPosts({ type: section.id, limit });
          viewAllUrl = section.id === 'trending' ? '/posts?sort=trending' : '/posts';
        } else {
          posts = await getPosts({
            type: section.sourceType,
            value: section.sourceValue,
            limit
          });
          viewAllUrl = `/${section.sourceType}/${section.sourceValue}`;
        }

        return { ...section, posts, viewAllUrl };
      });

    sectionsData = await Promise.all(sectionsPromise);
  } else {
    // Fallback if no sections defined in admin
    const latestNews = await getPosts({ limit: 10 });
    sectionsData = [{ name: 'Latest News', posts: latestNews, viewAllUrl: '/posts' }];
  }

  // 5. Render
  return (
    <div className="bg-white min-h-screen pb-20 font-sans" style={{ '--primary': primaryColor }}>
      <div className="container mx-auto px-4 pt-8">

        {/* --- HERO SECTION --- */}
        {featuredPost ? (
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
                      urlStructure={urlStructure}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="py-20 text-center border-2 border-dashed rounded-3xl border-gray-100">
            <p className="text-gray-400 font-medium">No published stories found for {siteName}.</p>
          </div>
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Dynamic Sections (Latest, Categories, etc.) */}
          <div className="lg:col-span-8 space-y-16">
            {sectionsData.map((section, index) => (
              <ResponsivePostGrid
                key={index}
                posts={section.posts.map(post => ({
                  ...post,
                  image: resolvePostImage(post, fallbackImage)
                }))}
                sectionName={section.name}
                primaryColor={primaryColor}
                viewAllUrl={section.viewAllUrl}
                urlStructure={urlStructure}
              />
            ))}
          </div>

          {/* Sidebar Widgets */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-10">
              <Sidebar primaryColor={primaryColor} />
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}