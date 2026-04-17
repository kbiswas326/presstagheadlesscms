import { getResolvedTokens, resolveTemplateId, tokensToCssVars } from './templates';

export const resolveTemplateFromConfig = (config) => {
  const fromBranding = config?.branding?.templateId;
  const fromSeo = config?.seo?.templateId;
  return resolveTemplateId(fromBranding || fromSeo);
};

export const applyTemplateToDocument = (templateId) => {
  if (typeof document === 'undefined') return;
  const resolved = getResolvedTokens(templateId);
  const el = document.documentElement;
  el.dataset.template = resolved.id;
  const vars = tokensToCssVars(resolved.tokens);
  Object.entries(vars).forEach(([k, v]) => {
    if (v == null) return;
    el.style.setProperty(k, String(v));
  });
};

