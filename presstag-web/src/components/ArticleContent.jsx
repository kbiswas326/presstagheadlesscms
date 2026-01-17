'use client';

import React from 'react';
import AdSpot from './AdSpot';

export default function ArticleContent({ content }) {
  if (!content) return null;
  
  // Fix image URLs: replace port 5000 with 5001 (for backward compatibility)
  const fixedContent = content.replace(/http:\/\/localhost:5000/g, 'http://localhost:5001');
  
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

  // Split by paragraph end tag
  const parts = fixedContent.split('</p>');
  const totalParagraphs = parts.length - 1;
  const middleIndex = Math.ceil(totalParagraphs / 2);
  
  let imageCount = 0;

  return parts.map((part, index) => {
    // Skip empty last part if it was a trailing </p>
    if (index === parts.length - 1 && !part.trim()) return null;
    
    // Re-add closing tag
    const contentPart = part + '</p>';
    const pIndex = index + 1;
    
    // Check for images in this part
    const imgMatches = (part.match(/<img/g) || []).length;
    const currentImageIndex = imageCount + 1; 
    if (imgMatches > 0) {
      imageCount += imgMatches;
    }

    return (
      <React.Fragment key={index}>
        <div 
          className={proseClasses}
          style={proseStyle}
          dangerouslySetInnerHTML={{ __html: contentPart }} 
        />
        
        {/* After Paragraph Ad */}
        <AdSpot position="article_paragraph" index={pIndex} />
        
        {/* Middle Ad */}
        {pIndex === middleIndex && <AdSpot position="article_middle" />}
        
        {/* After Image Ad */}
        {imgMatches > 0 && (
          Array.from({length: imgMatches}).map((_, i) => (
            <AdSpot key={`img-ad-${currentImageIndex + i}`} position="article_image" index={currentImageIndex + i} />
          ))
        )}
      </React.Fragment>
    );
  });
}
