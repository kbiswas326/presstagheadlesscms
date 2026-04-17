export const TEMPLATE_IDS = ['classic', 'bold', 'modern', 'news', 'magazine'];

export const resolveTemplateId = (raw) => {
  const cleaned = String(raw || '').trim().toLowerCase();
  return TEMPLATE_IDS.includes(cleaned) ? cleaned : 'classic';
};

