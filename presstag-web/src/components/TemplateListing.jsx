import React from 'react';
import ArticleGridCard from './ArticleGridCard';
import HorizontalCard from './HorizontalCard';
import Pagination from './Pagination';
import Sidebar from './Sidebar';

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
  const tpl = String(templateId || 'classic').toLowerCase();

  const header = (
    <div className="mb-8 border-b border-gray-200 pb-4">
      <h1 className="text-3xl font-bold text-gray-900">
        {heading}
      </h1>
      {meta ? <p className="text-gray-500 mt-1">{meta}</p> : null}
    </div>
  );

  if (tpl === 'bold') {
    return (
      <div className="bg-slate-950 min-h-screen pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 border-b border-white/10 pb-4">
            <h1 className="text-3xl font-bold text-white">{heading}</h1>
            {meta ? <p className="text-white/70 mt-1">{meta}</p> : null}
          </div>
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
                <div className="text-center py-20 text-white/70">
                  No posts found.
                </div>
              )}
            </div>
            {sidebar ? (
              <div className="lg:col-span-4 lg:sticky lg:top-0">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Sidebar variant="post" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

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

  if (tpl === 'magazine') {
    const lead = hasPosts ? posts[0] : null;
    const rest = hasPosts ? posts.slice(1) : [];
    return (
      <div className="bg-white min-h-screen pb-16">
        <div className="container mx-auto px-4 py-8">
          {header}
          {lead ? (
            <div className="mb-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <ArticleGridCard post={lead} urlStructure={urlStructure} />
                </div>
                <div className={sidebar ? 'lg:col-span-5' : 'lg:col-span-5'}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {rest.slice(0, 4).map((p, i) => (
                      <ArticleGridCard key={p?._id || i} post={p} urlStructure={urlStructure} variant={tpl} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className={sidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
              {hasPosts ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.slice(4).map((post, i) => (
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

  if (tpl === 'modern') {
    return (
      <div className="bg-white min-h-screen pb-16">
        <div className="container mx-auto px-4 py-10">
          {header}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className={sidebar ? 'lg:col-span-8' : 'lg:col-span-12'}>
              {hasPosts ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post, i) => (
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
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {header}
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
  );
}
