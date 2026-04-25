'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function EmbedScripts() {
  useEffect(() => {
    const processEmbeds = () => {
      if (window.twttr?.widgets?.load) {
        window.twttr.widgets.load();
      }
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
      }
    };

    const timers = [];
    timers.push(setTimeout(processEmbeds, 0));
    timers.push(setTimeout(processEmbeds, 1000));
    timers.push(setTimeout(processEmbeds, 2500));
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
        async
        charSet="utf-8"
        onLoad={() => {
          try {
            if (window.twttr?.widgets?.load) window.twttr.widgets.load();
          } catch {}
        }}
      />
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
        async
        onLoad={() => {
          try {
            if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
          } catch {}
        }}
      />
    </>
  );
}
