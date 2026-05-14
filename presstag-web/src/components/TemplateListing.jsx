import React from 'react';
import ArticleGridCard from './ArticleGridCard';
import HorizontalCard from './HorizontalCard';
import Pagination from './Pagination';
import Sidebar from './Sidebar';
import { resolveTemplateId } from '@/lib/templates';

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
    return (
      <div className="bg-white min-h-screen pb-16">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-10 pb-6 border-b border-gray-100">
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                  {heading}
                </h1>
                {meta ? <p className="text-gray-500 mt-2">{meta}</p> : null}
              </div>
              <div className="hidden md:block h-10 w-1 rounded-full" style={{ backgroundColor: primaryColor }} />
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
                    <div className="grid grid-cols-1 gap-6">
                      {rest.slice(0, 4).map((p, i) => (
                        <ArticleGridCard key={p?._id || i} post={p} urlStructure={urlStructure} variant="editorial" />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(lead ? rest.slice(sidebar ? 4 : 0) : posts).map((post, i) => (
                      <ArticleGridCard key={post?._id || i} post={post} urlStructure={urlStructure} variant="editorial" />
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
