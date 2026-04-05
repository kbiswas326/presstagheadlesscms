/// web> src> app> page.js | Main homepage component for the Presstag web app. This component fetches the layout configuration and posts from the backend API to dynamically render the homepage sections based on the admin-defined settings. It includes a hero section with featured posts, followed by multiple sections that can be customized to display posts from specific categories, tags, authors, or content types. The component also handles fallback images for posts that do not have a specific image set, ensuring a consistent visual experience. The sidebar is included for additional widgets and content as defined in the layout configuration. //
import React from "react";
import FeaturedHero from "../components/FeaturedHero";
import HorizontalCard from "../components/HorizontalCard";
import ArticleGridCard from "../components/ArticleGridCard";
import Sidebar from "../components/Sidebar";
import ResponsivePostGrid from "../components/ResponsivePostGrid";
import { getFallbackImage, resolvePostImage } from '../lib/imageHelper';
import { fetchWithTenant, fetchLayoutConfig } from '../lib/fetchWithTenant';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getLayoutConfig() {
  try {
    const res = await fetchLayoutConfig();
    if (res.ok) return res.json();
  } catch (e) { console.error(e); }
  return null;
}

async function getPosts(params = {}) {
  const { type = 'latest', value, limit = 10, excludeKeys = [] } = params;
  let path = `/posts?status=published&limit=${limit}`;
  if (type === 'category' && value) path += '&category=' + value;
  else if (type === 'tag' && value) path += '&tag=' + value;
  else if (type === 'author' && value) path += '&author=' + value;
  else if ((type === 'content_type' || type === 'type') && value) path += '&type=' + value;
  try {
    const res = await fetchWithTenant(path); // ✅ FIXED: was fetchLayoutConfig()
    if (!res.ok) return [];
    const data = await res.json();
    const posts = Array.isArray(data) ? data : (data.posts || []);
    if (!excludeKeys || excludeKeys.length === 0) return posts;
    const exclude = new Set(excludeKeys.map((k) => String(k || '')).filter(Boolean));
    return posts.filter((p) => !exclude.has(String(p?.slug || p?._id || '')));
  } catch (e) { return []; }
}

export default async function Page() {
  const config = await getLayoutConfig();
  const fallbackImage = await getFallbackImage();

  const primaryColor = config?.branding?.primaryColor || '#006356';
  const urlStructure = config?.seo?.postUrlStructure || '/{category}/{slug}';

  // HERO POSTS
  const heroPosts = await getPosts({ limit: 5 });
  const featuredPost = heroPosts[0];
  const sidePosts = heroPosts.slice(1, 5);

  const excludePostKeys = Array.from(
    new Set(
      [...heroPosts]
        .map((p) => String(p?.slug || p?._id || ''))
        .filter(Boolean)
    )
  );

  // DYNAMIC SECTIONS
  let sectionsData = [];

  if (config?.homepage?.sections) {
    const sectionsPromise = config.homepage.sections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order)
      .map(async (section) => {
        let posts = [];
        const limit = section.limit || 12;
        let viewAllUrl = null;

        if (section.type === 'system') {
          if (section.id === 'latest') {
            posts = await getPosts({ limit: limit + 5, excludeKeys: excludePostKeys });
            posts = posts.slice(0, limit);
            viewAllUrl = '/posts';
          } else if (section.id === 'trending') {
            posts = await getPosts({ limit: limit + 5, excludeKeys: excludePostKeys });
            posts = posts.slice(0, limit);
            viewAllUrl = '/posts?sort=trending';
          }
        } else if (section.type === 'custom') {
          posts = await getPosts({
            type: section.sourceType,
            value: section.sourceValue,
            limit: limit + 5,
            excludeKeys: excludePostKeys,
          });
          posts = posts.slice(0, limit);

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
                <FeaturedHero
                  post={{
                    ...featuredPost,
                    image: resolvePostImage(featuredPost, fallbackImage)
                  }}
                  urlStructure={urlStructure}
                />
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
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          <div className="lg:col-span-8">
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

          {/* SIDEBAR */}
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar excludePostKeys={excludePostKeys} />
          </div>

        </div>
      </div>
    </div>
  );
}
