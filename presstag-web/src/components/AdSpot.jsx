'use client';
import { useAds } from '../context/AdContext';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AdSpot({ position, className = '', index }) {
  const ads = useAds();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Mark when we're on client to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper to check page type
  const isPageMatch = (ad) => {
      const pageTypes = ad.displayConditions?.pageTypes;
      if (!pageTypes || pageTypes.length === 0) return true; // Default to all if not specified

      if (pathname === '/' && pageTypes.includes('home')) return true;
      if (pathname.startsWith('/posts/') && pageTypes.includes('post')) return true;
      if (pathname.startsWith('/category/') && pageTypes.includes('category')) return true;
      if (pathname.startsWith('/tag/') && pageTypes.includes('tag')) return true;
      if (pathname.startsWith('/author/') && pageTypes.includes('author')) return true;
      if (pathname.startsWith('/search') && pageTypes.includes('search')) return true;

      const parts = pathname.split('/').filter(Boolean);
      const isCatchAllRoute = parts.length > 0 && !(
        pathname.startsWith('/posts/') ||
        pathname.startsWith('/category/') ||
        pathname.startsWith('/tag/') ||
        pathname.startsWith('/author/') ||
        pathname.startsWith('/search') ||
        pathname.startsWith('/web-stories/') ||
        pathname.startsWith('/admin/')
      );

      if (isCatchAllRoute && parts.length >= 2 && pageTypes.includes('post')) return true;
      
      // Static page check
      const isSpecialRoute = pathname.startsWith('/posts/') || 
                           pathname.startsWith('/category/') || 
                           pathname.startsWith('/tag/') || 
                           pathname.startsWith('/author/') || 
                           pathname.startsWith('/search') ||
                           pathname === '/';
                           
      if (!isSpecialRoute && pageTypes.includes('page')) return true;

      return false;
  };

  // Helper to check insertion parameter
  const isIndexMatch = (ad) => {
      if (index === undefined) return true; // No index required for this spot
      
      const param = ad.displayConditions?.insertionParameter;
      // If ad has a param, it must match the passed index
      if (param) {
          return parseInt(param) === index;
      }
      // If ad has no param but we are in a position that usually requires one
      if (position === 'article_paragraph' || position === 'article_image') {
          return false; // Don't show if no param set for these positions
      }
      return true;
  };

  // Helper to get device classes
  const getDeviceClasses = (ad) => {
      const devices = ad.displayConditions?.devices;
      if (!devices || devices.length === 0) return 'block'; // Default to all if not specified

      const hasMobile = devices.includes('mobile');
      const hasTablet = devices.includes('tablet');
      const hasDesktop = devices.includes('desktop');
      
      if (hasMobile && hasTablet && hasDesktop) return 'block';
      
      if (hasMobile && !hasTablet && !hasDesktop) return 'block md:hidden';
      if (!hasMobile && hasTablet && !hasDesktop) return 'hidden md:block lg:hidden';
      if (!hasMobile && !hasTablet && hasDesktop) return 'hidden lg:block';
      
      if (hasMobile && hasTablet && !hasDesktop) return 'block lg:hidden';
      if (!hasMobile && hasTablet && hasDesktop) return 'hidden md:block';
      if (hasMobile && !hasTablet && hasDesktop) return 'block md:hidden lg:block';
      
      return 'hidden';
  };

  const filteredAds = ads
    .filter(ad => ad.position === position && ad.isActive && isPageMatch(ad) && isIndexMatch(ad))
    .sort((a, b) => a.priority - b.priority);

  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
        const scripts = containerRef.current.querySelectorAll('script');
        scripts.forEach(oldScript => {
            // Check if script has already been processed to avoid infinite loops if re-renders happen
            if (oldScript.dataset.processed) return;
            
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.dataset.processed = 'true';
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }
  }, [filteredAds]);

  // Don't render ads on server to avoid hydration mismatch
  if (!isClient || filteredAds.length === 0) return null;

  return (
    <div ref={containerRef} className={`ad-spot ad-${position} ${className} flex flex-col gap-4 items-center justify-center my-4`}>
      {filteredAds.map(ad => (
        <div 
            key={ad._id} 
            className={`w-full max-w-full overflow-hidden flex justify-center ${getDeviceClasses(ad)}`}
        >
            <div dangerouslySetInnerHTML={{ __html: ad.code }} />
        </div>
      ))}
    </div>
  );
}
