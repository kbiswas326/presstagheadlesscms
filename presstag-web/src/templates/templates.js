export const TEMPLATE_IDS = ['classic', 'modern', 'magazine', 'minimal', 'bold'];

const baseTokens = {
  fontBody: 'var(--font-roboto)',
  fontHeading: 'var(--font-pt-serif)',
  bg: '#f8f9fa',
  surface: '#ffffff',
  text: '#0f172a',
  muted: '#475569',
  border: '#e5e7eb',
  radiusSm: '10px',
  radiusMd: '14px',
  radiusLg: '18px',
  shadowSm: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
  shadowMd: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
  containerMax: '1200px',
};

export const templates = [
  {
    id: 'classic',
    name: 'Classic',
    tokens: {
      containerMax: '1200px',
      radiusMd: '14px',
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    tokens: {
      bg: '#ffffff',
      surface: '#ffffff',
      text: '#0b1220',
      border: '#e6e8ee',
      radiusMd: '16px',
      radiusLg: '22px',
      shadowSm: '0 1px 1px 0 rgb(0 0 0 / 0.05)',
      shadowMd: '0 16px 30px -18px rgb(0 0 0 / 0.24)',
      containerMax: '1260px',
    },
  },
  {
    id: 'magazine',
    name: 'Magazine',
    tokens: {
      bg: '#f6f2ee',
      surface: '#ffffff',
      text: '#141414',
      muted: '#4b5563',
      border: '#e7e0da',
      fontHeading: 'var(--font-roboto)',
      radiusSm: '8px',
      radiusMd: '12px',
      radiusLg: '16px',
      shadowSm: '0 1px 2px 0 rgb(20 20 20 / 0.06)',
      shadowMd: '0 18px 30px -22px rgb(20 20 20 / 0.28)',
      containerMax: '1320px',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tokens: {
      bg: '#ffffff',
      surface: '#ffffff',
      text: '#111827',
      muted: '#6b7280',
      border: '#f0f2f5',
      radiusSm: '8px',
      radiusMd: '10px',
      radiusLg: '12px',
      shadowSm: 'none',
      shadowMd: 'none',
      containerMax: '1140px',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    tokens: {
      bg: '#0b1220',
      surface: '#0f1a30',
      text: '#e5e7eb',
      muted: '#a5b4fc',
      border: '#24304a',
      fontHeading: 'var(--font-roboto)',
      radiusSm: '14px',
      radiusMd: '18px',
      radiusLg: '24px',
      shadowSm: '0 1px 2px 0 rgb(0 0 0 / 0.28)',
      shadowMd: '0 26px 60px -34px rgb(0 0 0 / 0.6)',
      containerMax: '1260px',
    },
  },
];

export const resolveTemplateId = (candidate) => {
  const cleaned = String(candidate || '').trim().toLowerCase();
  return TEMPLATE_IDS.includes(cleaned) ? cleaned : 'classic';
};

export const getTemplate = (candidate) => {
  const id = resolveTemplateId(candidate);
  const tpl = templates.find((t) => t.id === id) || templates[0];
  return tpl || { id: 'classic', name: 'Classic', tokens: {} };
};

export const getResolvedTokens = (candidate) => {
  const tpl = getTemplate(candidate);
  const merged = { ...baseTokens, ...(tpl.tokens || {}) };
  return { id: tpl.id, name: tpl.name, tokens: merged };
};

export const tokensToCssVars = (tokens) => ({
  '--site-font-body': tokens.fontBody,
  '--site-font-heading': tokens.fontHeading,
  '--site-bg': tokens.bg,
  '--site-surface': tokens.surface,
  '--site-text': tokens.text,
  '--site-muted': tokens.muted,
  '--site-border': tokens.border,
  '--site-radius-sm': tokens.radiusSm,
  '--site-radius-md': tokens.radiusMd,
  '--site-radius-lg': tokens.radiusLg,
  '--site-shadow-sm': tokens.shadowSm,
  '--site-shadow-md': tokens.shadowMd,
  '--site-container-max': tokens.containerMax,
});

