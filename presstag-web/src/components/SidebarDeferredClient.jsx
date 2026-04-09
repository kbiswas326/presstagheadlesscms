'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false });

export default function SidebarDeferredClient(props) {
  const ref = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver !== 'function') {
      const t = setTimeout(() => setShouldRender(true), 1500);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: '400px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div ref={ref}>
      {shouldRender ? <Sidebar {...props} /> : <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-gray-100 rounded-lg"></div>
        <div className="h-48 bg-gray-100 rounded-lg"></div>
      </div>}
    </div>
  );
}

