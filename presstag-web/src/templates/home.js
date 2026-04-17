import FeaturedHero from '../components/FeaturedHero';
import HorizontalCard from '../components/HorizontalCard';
import ArticleGridCard from '../components/ArticleGridCard';
import ResponsivePostGrid from '../components/ResponsivePostGrid';
import Sidebar from '../components/Sidebar';

const SectionHeading = ({ label, primaryColor, viewAllUrl }) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-gray-900 border-l-4 pl-3" style={{ borderColor: primaryColor }}>
        {label}
      </h2>
      {viewAllUrl ? (
        <a href={viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
          View all
        </a>
      ) : null}
    </div>
  );
};

export const renderHomeClassic = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  fallbackImage,
  primaryColor,
  urlStructure,
}) => {
  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        {featuredPost ? (
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2">
                <FeaturedHero post={featuredPost} urlStructure={urlStructure} />
              </div>
              <div className="lg:col-span-1 flex flex-col h-full">
                <SectionHeading label="Top Stories" primaryColor={primaryColor} />
                <div className="flex flex-col gap-4 flex-grow">
                  {sidePosts.map((post, i) => (
                    <HorizontalCard key={i} post={post} urlStructure={urlStructure} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {sectionsData.map((section, index) => (
              <ResponsivePostGrid
                key={index}
                posts={section.posts}
                sectionName={section.name}
                primaryColor={primaryColor}
                viewAllUrl={section.viewAllUrl}
                urlStructure={urlStructure}
              />
            ))}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeBold = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  primaryColor,
  urlStructure,
}) => {
  return (
    <div className="bg-slate-950 min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        {featuredPost ? (
          <section className="mb-10">
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <FeaturedHero post={featuredPost} urlStructure={urlStructure} />
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Top Stories
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {sidePosts.map((post, i) => (
                  <ArticleGridCard key={i} post={post} urlStructure={urlStructure} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-9">
            {sectionsData.map((section, index) => {
              const isLead = index === 0;
              if (isLead) {
                return (
                  <section key={index} className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl font-bold text-white">{section.name}</h2>
                      {section.viewAllUrl ? (
                        <a href={section.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                          View all
                        </a>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {section.posts.slice(0, 6).map((post, i) => (
                        <HorizontalCard key={i} post={post} urlStructure={urlStructure} />
                      ))}
                    </div>
                  </section>
                );
              }
              return (
                <ResponsivePostGrid
                  key={index}
                  posts={section.posts}
                  sectionName={section.name}
                  primaryColor={primaryColor}
                  viewAllUrl={section.viewAllUrl}
                  urlStructure={urlStructure}
                />
              );
            })}
          </div>
          <div className="lg:col-span-3 lg:sticky lg:top-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeModern = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  primaryColor,
  urlStructure,
}) => {
  const topGrid = [featuredPost, ...sidePosts].filter(Boolean).slice(0, 4);
  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-8">
        <section className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              {topGrid[0] ? (
                <FeaturedHero post={topGrid[0]} urlStructure={urlStructure} />
              ) : null}
            </div>
            <div className="lg:col-span-4">
              <div className="grid grid-cols-1 gap-4">
                {topGrid.slice(1, 4).map((post, i) => (
                  <HorizontalCard key={i} post={post} urlStructure={urlStructure} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {sectionsData.map((section, index) => (
              <section key={index} className="mb-12">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                  <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
                  {section.viewAllUrl ? (
                    <a href={section.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                      View all
                    </a>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.posts.slice(0, 9).map((post, i) => (
                    <ArticleGridCard key={i} post={post} urlStructure={urlStructure} />
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeNews = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  primaryColor,
  urlStructure,
}) => {
  const headlinePosts = sidePosts.slice(0, 4);
  const leadSection = sectionsData[0];
  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        <section className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              {featuredPost ? <FeaturedHero post={featuredPost} urlStructure={urlStructure} /> : null}
            </div>
            <div className="lg:col-span-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Headlines</h2>
              </div>
              <div className="flex flex-col gap-4">
                {headlinePosts.map((post, i) => (
                  <HorizontalCard key={i} post={post} urlStructure={urlStructure} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {leadSection ? (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-5 border-b border-gray-200 pb-3">
                  <h2 className="text-xl font-bold text-gray-900">{leadSection.name}</h2>
                  {leadSection.viewAllUrl ? (
                    <a href={leadSection.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                      View all
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-col gap-5">
                  {leadSection.posts.slice(0, 10).map((post, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                      <HorizontalCard post={post} urlStructure={urlStructure} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {sectionsData.slice(1).map((section, index) => (
              <ResponsivePostGrid
                key={index}
                posts={section.posts}
                sectionName={section.name}
                primaryColor={primaryColor}
                viewAllUrl={section.viewAllUrl}
                urlStructure={urlStructure}
              />
            ))}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeMagazine = ({
  featuredPost,
  sidePosts,
  sectionsData,
  excludePostKeys,
  primaryColor,
  urlStructure,
}) => {
  const topMosaic = sidePosts.slice(0, 4);
  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 pt-6">
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              {featuredPost ? <FeaturedHero post={featuredPost} urlStructure={urlStructure} /> : null}
            </div>
            <div className="lg:col-span-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {topMosaic.map((post, i) => (
                  <ArticleGridCard key={i} post={post} urlStructure={urlStructure} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {sectionsData.map((section, index) => {
              const lead = section.posts[0];
              const rest = section.posts.slice(1, 7);
              return (
                <section key={index} className="mb-14">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-2xl font-bold text-gray-900">{section.name}</h2>
                    {section.viewAllUrl ? (
                      <a href={section.viewAllUrl} className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                        View all
                      </a>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7">
                      {lead ? <FeaturedHero post={lead} urlStructure={urlStructure} /> : null}
                    </div>
                    <div className="lg:col-span-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {rest.map((post, i) => (
                          <ArticleGridCard key={i} post={post} urlStructure={urlStructure} />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-0">
            <Sidebar variant="homepage" excludePostKeys={excludePostKeys} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderHomeByTemplate = (templateId, props) => {
  if (templateId === 'bold') return renderHomeBold(props);
  if (templateId === 'modern') return renderHomeModern(props);
  if (templateId === 'news') return renderHomeNews(props);
  if (templateId === 'magazine') return renderHomeMagazine(props);
  return renderHomeClassic(props);
};

