export const TEMPLATE_IDS = ['classic', 'editorial', 'modern', 'news'];

const TEMPLATE_ALIASES = {
  bold: 'modern',
  magazine: 'modern',
};

export const resolveTemplateId = (raw) => {
  const cleaned = String(raw || '').trim().toLowerCase();
  const aliased = TEMPLATE_ALIASES[cleaned] || cleaned;
  return TEMPLATE_IDS.includes(aliased) ? aliased : 'classic';
};
