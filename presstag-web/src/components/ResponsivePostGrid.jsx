/// web> src> components> ResponsivePostGrid.jsx | A responsive grid component for displaying a collection of posts, with a section title and optional "View All" link. Adapts to different screen sizes by showing a grid layout on desktop and a horizontal scrollable layout on mobile. --- IGNORE ---
import React from 'react';
import ArticleGridCard from './ArticleGridCard';
import HorizontalCard from './HorizontalCard';
import Link from 'next/link';

const ResponsivePostGrid = ({ posts, title, sectionName, primaryColor = '#006356', viewAllUrl, urlStructure, variant = 'classic' }) => {
  if (!posts || posts.length === 0) return null;
  const tpl = String(variant || '').trim().toLowerCase();
  const isBold = tpl === 'bold';
  const isNews = tpl === 'news';
  const isModern = tpl === 'modern';
  const isMagazine = tpl === 'magazine';
  const headingSize = isBold ? 'text-2xl md:text-3xl' : (isNews ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl');
  const headingWeight = isBold ? 'font-extrabold' : 'font-bold';
  const wrapperGap = isNews ? 'mb-10' : 'mb-12';
  const borderColor = isBold ? 'border-gray-200' : 'border-gray-100';
  const viewAllClass = isBold ? 'text-sm font-bold uppercase tracking-widest hover:opacity-80' : 'text-sm font-medium hover:underline';

  return (
    <div className={wrapperGap}>
      <div className={`flex items-end justify-between gap-4 mb-6 pb-4 border-b ${borderColor}`}>
        <h2 className={`${headingSize} ${headingWeight} text-gray-900 flex items-center gap-3`}>
          <span
            className={isNews ? 'w-1 h-7 rounded-full' : 'w-2 h-8 rounded-full'}
            style={{ backgroundColor: primaryColor }}
          />
          <span className={isNews ? 'uppercase tracking-wider text-[0.95em]' : ''}>
            {sectionName || title}
          </span>
        </h2>
        {viewAllUrl && (
          <Link 
            href={viewAllUrl} 
            className={`${viewAllClass} flex items-center gap-1`}
            style={{ color: primaryColor }}
          >
            View All 
            <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </div>

      {isNews ? (
        <div className="hidden md:flex flex-col gap-6">
          {posts.map((post, i) => (
            <div key={String(post?._id || post?.slug || i)} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
              <HorizontalCard post={post} urlStructure={urlStructure} variant={variant} />
            </div>
          ))}
        </div>
      ) : (
        <div className={`hidden md:grid gap-7 ${isModern || isMagazine ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {posts.map((post, i) => (
            <ArticleGridCard key={String(post?._id || post?.slug || i)} post={post} urlStructure={urlStructure} variant={variant} />
          ))}
        </div>
      )}

      {/* Mobile View: Horizontal Scroll (Slider look) */}
      {isNews ? (
        <div className="md:hidden flex flex-col gap-5">
          {posts.map((post, i) => (
            <div key={String(post?._id || post?.slug || i)} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
              <HorizontalCard post={post} urlStructure={urlStructure} variant={variant} />
            </div>
          ))}
        </div>
      ) : (
        <div className="md:hidden flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {posts.map((post, i) => (
            <div key={String(post?._id || post?.slug || i)} className="min-w-[85%] snap-center">
              <ArticleGridCard post={post} urlStructure={urlStructure} variant={variant} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponsivePostGrid;
