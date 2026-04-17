'use client';

import { useEffect } from 'react';
import { applyTemplateToDocument, resolveTemplateFromConfig } from '../templates/applyTemplate';

export default function TemplateHydrator({ config }) {
  useEffect(() => {
    let qp = '';
    try {
      qp = new URLSearchParams(window.location.search).get('template') || '';
    } catch (_) {
      qp = '';
    }
    const fromConfig = resolveTemplateFromConfig(config);
    applyTemplateToDocument(qp || fromConfig);
  }, [config]);

  return null;
}
