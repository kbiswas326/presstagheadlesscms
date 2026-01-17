'use client';

import { useEffect } from 'react';

export default function EmbedScripts() {
  useEffect(() => {
    // Ensure embeds are processed when the component mounts
    const processEmbeds = () => {
      if (window.twttr?.widgets?.load) {
        window.twttr.widgets.load();
      }
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
      }
    };

    // Call after a delay to ensure scripts are loaded
    const timer = setTimeout(processEmbeds, 1000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
