'use client';

import React, { useEffect } from 'react';
import AdSpot from './AdSpot';

export default function ArticleContent({ content }) {
  const safeContent = content || '';

  // Fix image URLs: replace port 5000 with 5001 (for backward compatibility)
  const fixedContent = safeContent.replace(/http:\/\/localhost:5000/g, 'http://localhost:5001');

  useEffect(() => {
    if (!safeContent) return;
    const hasTwitter = safeContent.includes('twitter-tweet') || safeContent.includes('pbs.twimg.com');
    const hasInstagram = safeContent.includes('instagram-media') || safeContent.includes('instagram.com');
    if (!hasTwitter && !hasInstagram) return;

    const processEmbeds = () => {
      if (hasTwitter && window.twttr?.widgets?.load) {
        try {
          window.twttr.widgets.load();
        } catch {}
      }
      if (hasInstagram && window.instgrm?.Embeds?.process) {
        try {
          window.instgrm.Embeds.process();
        } catch {}
      }
    };

    const schedule =
      typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb) => setTimeout(cb, 1500);

    const handle = schedule(processEmbeds);
    const t1 = setTimeout(processEmbeds, 2500);
    const t2 = setTimeout(processEmbeds, 5000);

    return () => {
      if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        try { window.cancelIdleCallback(handle); } catch {}
      }
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [safeContent]);
  
  if (!safeContent) return null;
  
  // Prose classes
  const proseClasses = `prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mb-2 prose-headings:mt-6 prose-p:text-gray-700 prose-p:leading-loose prose-p:my-2
    prose-a:no-underline hover:prose-a:underline
    prose-img:rounded-xl prose-img:shadow-md
    prose-blockquote:border-l-4 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic
    prose-blockquote:bg-gray-50`;
  
  const proseStyle = {
    '--tw-prose-links': 'var(--primary-color)',
    '--tw-prose-quote-borders': 'var(--primary-color)',
  };

  const paragraphParts = fixedContent.split('</p>');
  const paragraphs = paragraphParts
    .map((p, i) => (i === paragraphParts.length - 1 ? p : `${p}</p>`))
    .map((p) => p.trim())
    .filter(Boolean);

  const earlyParagraphCount = Math.min(6, paragraphs.length);
  const early = paragraphs.slice(0, earlyParagraphCount);
  const rest = paragraphs.slice(earlyParagraphCount);

  return (
    <>
      {early.map((html, idx) => {
        const paragraphIndex = idx + 1;
        const showParagraphAd = paragraphIndex === 2 || paragraphIndex === 4 || paragraphIndex === 6;
        return (
          <React.Fragment key={paragraphIndex}>
            <div className={proseClasses} style={proseStyle} dangerouslySetInnerHTML={{ __html: html }} />
            {showParagraphAd ? <AdSpot position="article_paragraph" index={paragraphIndex} /> : null}
          </React.Fragment>
        );
      })}

      <AdSpot position="article_middle" />

      {rest.length > 0 ? (
        <div className={proseClasses} style={proseStyle} dangerouslySetInnerHTML={{ __html: rest.join('') }} />
      ) : null}
    </>
  );
}
