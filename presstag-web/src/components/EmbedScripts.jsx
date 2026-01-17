'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function EmbedScripts() {
  useEffect(() => {
    // Twitter/X
    if (document.querySelector('.twitter-tweet')) {
      const script = document.createElement('script');
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.body.appendChild(script);
    }

    // Instagram
    if (document.querySelector('.instagram-media')) {
        const script = document.createElement('script');
        script.src = "//www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
    }
  }, []);

  return (
    <>
      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
      <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
    </>
  );
}
