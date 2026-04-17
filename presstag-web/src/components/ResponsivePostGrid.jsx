/// web> src> components> ResponsivePostGrid.jsx | A responsive grid component for displaying a collection of posts, with a section title and optional "View All" link. Adapts to different screen sizes by showing a grid layout on desktop and a horizontal scrollable layout on mobile. --- IGNORE ---
import React from 'react';
import ArticleGridCard from './ArticleGridCard';
import Link from 'next/link';

const ResponsivePostGrid = ({ posts, title, sectionName, primaryColor = '#006356', viewAllUrl, urlStructure, variant = 'classic' }) => {
  if (!posts || posts.length === 0) return null;
  const tpl = String(variant || '').trim().toLowerCase();
  const isBold = tpl === 'bold';

  return (
    <div className="mb-12">
      <div className={`flex items-center justify-between mb-6 pb-4 border-b ${isBold ? 'border-white/10' : 'border-gray-100'}`}>
        <h2 className={`text-2xl font-bold flex items-center gap-3 ${isBold ? 'text-white' : 'text-gray-900'}`}>
          <span 
            className="w-2 h-8 rounded-full"
            style={{ backgroundColor: primaryColor }}
          ></span>
          {sectionName || title}
        </h2>
        {viewAllUrl && (
          <Link 
            href={viewAllUrl} 
            className="text-sm font-medium hover:underline flex items-center gap-1"
            style={{ color: primaryColor }}
          >
            View All 
            <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </div>

      {/* Desktop View: Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post, i) => (
          <ArticleGridCard key={i} post={post} urlStructure={urlStructure} variant={variant} />
        ))}
      </div>

      {/* Mobile View: Horizontal Scroll (Slider look) */}
      <div className="md:hidden flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {posts.map((post, i) => (
          <div key={i} className="min-w-[85%] snap-center">
            <ArticleGridCard post={post} urlStructure={urlStructure} variant={variant} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsivePostGrid;
