'use client';

import React, { useEffect } from 'react';
import AdSpot from './AdSpot';

const inferImageDimensions = (src) => {
  const url = String(src || '');
  const fitIn = url.match(/fit-in\/(\d+)x(\d+)/i);
  if (fitIn) return { width: fitIn[1], height: fitIn[2] };

  const whQuery = url.match(/[?&](?:w|width)=(\d+).*?[?&](?:h|height)=(\d+)/i);
  if (whQuery) return { width: whQuery[1], height: whQuery[2] };

  const hwQuery = url.match(/[?&](?:h|height)=(\d+).*?[?&](?:w|width)=(\d+)/i);
  if (hwQuery) return { width: hwQuery[2], height: hwQuery[1] };

  const dimInPath = url.match(/\/(\d{2,5})x(\d{2,5})\b/i);
  if (dimInPath) return { width: dimInPath[1], height: dimInPath[2] };

  return null;
};

const optimizeInlineImages = (html) => {
  const raw = String(html || '');
  if (!raw.includes('<img')) return raw;

  return raw.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    const hasLoading = /\bloading\s*=\s*["'][^"']*["']/i.test(attrs);
    const hasDecoding = /\bdecoding\s*=\s*["'][^"']*["']/i.test(attrs);
    const hasFetchPriority = /\bfetchpriority\s*=\s*["'][^"']*["']/i.test(attrs);
    const hasWidth = /\bwidth\s*=\s*["']?\d+["']?/i.test(attrs);
    const hasHeight = /\bheight\s*=\s*["']?\d+["']?/i.test(attrs);

    let nextAttrs = attrs;

    if (!hasLoading) nextAttrs += ' loading="lazy"';
    if (!hasDecoding) nextAttrs += ' decoding="async"';
    if (!hasFetchPriority) nextAttrs += ' fetchpriority="low"';

    if (!hasWidth || !hasHeight) {
      const srcMatch = nextAttrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
      const dims = inferImageDimensions(srcMatch?.[1]);
      const width = dims?.width || '1200';
      const height = dims?.height || '675';
      if (!hasWidth) nextAttrs += ` width="${width}"`;
      if (!hasHeight) nextAttrs += ` height="${height}"`;
    }

    if (!/\bstyle\s*=\s*["'][^"']*["']/i.test(nextAttrs)) {
      nextAttrs += ' style="height:auto;max-width:100%"';
    }

    return `<img${nextAttrs}>`;
  });
};

export default function ArticleContent({ content }) {
  const safeContent = content || '';

  // Fix image URLs: replace port 5000 with 5001 (for backward compatibility)
  const fixedContent = optimizeInlineImages(
    safeContent.replace(/http:\/\/localhost:5000/g, 'http://localhost:5001')
  );

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
  const proseClasses = `prose prose-lg prose-green max-w-none prose-headings:text-gray-900 prose-headings:mb-2 prose-headings:mt-6 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-3
    prose-h1:font-black prose-h2:font-black prose-h3:font-semibold prose-h4:font-semibold prose-h5:font-semibold prose-h6:font-semibold
    prose-a:underline prose-a:underline-offset-2
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
    <div className="article-content" style={{ contentVisibility: 'auto', containIntrinsicSize: '1200px' }}>
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
    </div>
  );
}
