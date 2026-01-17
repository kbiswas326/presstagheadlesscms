'use client';

import React, { useEffect } from 'react';
import AdSpot from './AdSpot';

export default function ArticleContent({ content }) {
  if (!content) return null;
  
  // Fix image URLs: replace port 5000 with 5001 (for backward compatibility)
  const fixedContent = content.replace(/http:\/\/localhost:5000/g, 'http://localhost:5001');

  // Process embeds after content is rendered
  useEffect(() => {
    // Process embeds when content changes
    const processEmbeds = () => {
      console.log('Processing embeds...', {
        twttr: !!window.twttr,
        widgets: !!window.twttr?.widgets,
        blockquotes: document.querySelectorAll('.twitter-tweet').length
      });

      // Twitter embeds - convert blockquote elements into proper tweet widgets
      if (window.twttr?.widgets?.load) {
        try {
          window.twttr.widgets.load();
          console.log('✅ Twitter widgets loaded');
        } catch (e) {
          console.error('❌ Twitter widgets error:', e);
        }
      } else {
        console.warn('⚠️ Twitter widgets not available');
      }

      // Instagram embeds
      if (window.instgrm?.Embeds?.process) {
        try {
          window.instgrm.Embeds.process();
          console.log('✅ Instagram embeds processed');
        } catch (e) {
          console.error('❌ Instagram embeds error:', e);
        }
      }
    };

    // Process immediately
    processEmbeds();

    // Also process after delays for slower script loading
    const timer1 = setTimeout(processEmbeds, 300);
    const timer2 = setTimeout(processEmbeds, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [content]);
  
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

  // Split content while preserving blockquote elements intact
  const parts = [];
  let currentIndex = 0;
  
  // Find all twitter-tweet blockquotes and keep them intact
  const blockquoteRegex = /<blockquote\s+class="twitter-tweet"[\s\S]*?<\/blockquote>/g;
  let match;
  const blockquotes = [];
  
  while ((match = blockquoteRegex.exec(fixedContent)) !== null) {
    blockquotes.push({ start: match.index, end: match.index + match[0].length, html: match[0] });
  }

  // Build parts array, inserting blockquotes as separate items
  blockquotes.forEach((blockquote) => {
    if (currentIndex < blockquote.start) {
      // Add regular content before blockquote
      const regularContent = fixedContent.substring(currentIndex, blockquote.start);
      if (regularContent.trim()) {
        parts.push({ type: 'content', html: regularContent });
      }
    }
    // Add blockquote
    parts.push({ type: 'blockquote', html: blockquote.html });
    currentIndex = blockquote.end;
  });

  // Add remaining content after last blockquote
  if (currentIndex < fixedContent.length) {
    const remaining = fixedContent.substring(currentIndex);
    if (remaining.trim()) {
      parts.push({ type: 'content', html: remaining });
    }
  }

  // If no blockquotes found, treat entire content as one part
  if (parts.length === 0) {
    parts.push({ type: 'content', html: fixedContent });
  }

  let imageCount = 0;
  let paragraphCount = 0;

  return parts.map((part, index) => {
    if (part.type === 'blockquote') {
      // Render Twitter blockquote without breaking it
      return (
        <div 
          key={index}
          className={proseClasses}
          style={proseStyle}
          dangerouslySetInnerHTML={{ __html: part.html }} 
        />
      );
    }

    // For regular content, split by paragraphs and insert ads
    const subParts = part.html.split('</p>');
    const totalParagraphs = subParts.length - 1;
    const middleIndex = Math.ceil(totalParagraphs / 2);

    return subParts.map((subPart, subIndex) => {
      if (subIndex === subParts.length - 1 && !subPart.trim()) return null;

      paragraphCount++;
      const contentPart = subPart + '</p>';
      const imgMatches = (subPart.match(/<img/g) || []).length;
      const currentImageIndex = imageCount + 1;
      
      if (imgMatches > 0) {
        imageCount += imgMatches;
      }

      return (
        <React.Fragment key={`${index}-${subIndex}`}>
          <div 
            className={proseClasses}
            style={proseStyle}
            dangerouslySetInnerHTML={{ __html: contentPart }} 
          />
          
          {/* After Paragraph Ad */}
          <AdSpot position="article_paragraph" index={paragraphCount} />
          
          {/* Middle Ad */}
          {paragraphCount === middleIndex && <AdSpot position="article_middle" />}
          
          {/* After Image Ad */}
          {imgMatches > 0 && (
            Array.from({length: imgMatches}).map((_, i) => (
              <AdSpot key={`img-ad-${currentImageIndex + i}`} position="article_image" index={currentImageIndex + i} />
            ))
          )}
        </React.Fragment>
      );
    });
  });
}
