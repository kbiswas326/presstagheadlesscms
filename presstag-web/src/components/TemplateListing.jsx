import React from 'react';
import ArticleGridCard from './ArticleGridCard';
import HorizontalCard from './HorizontalCard';
import Pagination from './Pagination';
import Sidebar from './Sidebar';
import { resolveTemplateId } from '@/lib/templates';
import FeaturedHero from './FeaturedHero';

export default function TemplateListing({
  templateId = 'classic',
  heading,
  meta,
  posts,
  page,
  totalPages,
  baseUrl,
  primaryColor = '#006356',
  urlStructure,
  sidebar = true,
}) {
  const hasPosts = Array.isArray(posts) && posts.length > 0;
  const tpl = resolveTemplateId(templateId);

  const header = (
    <div className="mb-8 border-b border-gray-200 pb-4">
      <h1 className="text-3xl font-bold text-gray-900">
        {heading}
      </h1>
      {meta ? <p className="text-gray-500 mt-1">{meta}</p> : null}
    </div>
  );

  if (tpl === 'news') {
    return (
      <div className="bg-white min-h-screen pb-16">
        <div className="container mx-auto px-4 py-8">
          {header}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className={sidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
              {hasPosts ? (
                <>
                  <div className="flex flex-col gap-5">
                    {posts.map((post, i) => (
                      <div key={post?._id || i} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                        <HorizontalCard post={post} urlStructure={urlStructure} variant={tpl} />
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 ? (
                    <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
                  ) : null}
                </>
              ) : (
                <div className="text-center py-20 text-gray-500">No posts found.</div>
              )}
            </div>
            {sidebar ? (
              <div className="lg:col-span-4 lg:sticky lg:top-0">
                <Sidebar variant="post" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (tpl === 'editorial') {
    const lead = hasPosts ? posts[0] : null;
    const rest = hasPosts ? posts.slice(1) : [];
    const topRail = sidebar ? rest.slice(0, 3) : [];
    const remaining = sidebar ? rest.slice(3) : rest;
    const listPosts = lead ? remaining : posts;
    return (
      <div className="bg-white min-h-screen pb-16">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-10 pb-6 border-b border-gray-200">
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                <h1 className="editorial-display text-gray-900">
                  {heading}
                </h1>
                {meta ? <p className="text-gray-500 mt-2">{meta}</p> : null}
              </div>
              <div className="hidden md:block h-10 w-1 rounded-none" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>

          {lead ? (
            <div className="mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className={sidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
                  <ArticleGridCard post={lead} urlStructure={urlStructure} variant="editorial" />
                </div>
                {sidebar ? (
                  <div className="lg:col-span-4">
                    <div className="flex flex-col gap-6">
                      {topRail.map((p, i) => (
                        <HorizontalCard key={p?._id || i} post={p} urlStructure={urlStructure} variant="editorial" />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className={sidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
              {hasPosts ? (
                <>
                  <div className="flex flex-col gap-6">
                    {listPosts.map((post, i) => (
                      <HorizontalCard key={post?._id || i} post={post} urlStructure={urlStructure} variant="editorial" />
                    ))}
                  </div>
                  {totalPages > 1 ? (
                    <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
                  ) : null}
                </>
              ) : (
                <div className="text-center py-20 text-gray-500">No posts found.</div>
              )}
            </div>
            {sidebar ? (
              <div className="lg:col-span-4 lg:sticky lg:top-0">
                <Sidebar variant="post" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (tpl === 'modern') {
    const lead = hasPosts ? posts[0] : null;
    const rest = hasPosts ? posts.slice(1) : [];
    return (
      <div className="bg-white min-h-screen pb-16">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-10">
            <div className="-mx-4 lg:-mx-8 px-4 lg:px-8 py-10 rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white border border-gray-900/20">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wider uppercase">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                  Browse
                </div>
                <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
                  {heading}
                </h1>
                {meta ? <p className="mt-4 text-base md:text-lg text-white/70">{meta}</p> : null}
              </div>
            </div>
          </div>

          {lead ? (
            <div className="mb-12">
              <FeaturedHero post={lead} urlStructure={urlStructure} heightClassName="h-[360px] md:h-[460px]" className="rounded-3xl" />
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className={sidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
              {hasPosts ? (
                <>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-950">Latest</h2>
                    <div className="h-1 w-14 rounded-full" style={{ backgroundColor: primaryColor }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(lead ? rest : posts).map((post, i) => (
                      <ArticleGridCard key={post?._id || i} post={post} urlStructure={urlStructure} variant={tpl} />
                    ))}
                  </div>
                  {totalPages > 1 ? (
                    <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
                  ) : null}
                </>
              ) : (
                <div className="text-center py-20 text-gray-500">No posts found.</div>
              )}
            </div>
            {sidebar ? (
              <div className="lg:col-span-4 lg:sticky lg:top-0">
                <Sidebar variant="post" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="container mx-auto px-4 py-8">
        {header}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className={sidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
            {hasPosts ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, i) => (
                    <ArticleGridCard key={post?._id || i} post={post} urlStructure={urlStructure} variant={tpl} />
                  ))}
                </div>
                {totalPages > 1 ? (
                  <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
                ) : null}
              </>
            ) : (
              <div className="text-center py-20">
                <h2 className="text-xl text-gray-500">No posts found.</h2>
              </div>
            )}
          </div>
          {sidebar ? (
            <div className="lg:col-span-4 lg:sticky lg:top-0">
              <Sidebar variant="post" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
