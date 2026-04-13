import React from 'react';

const parseAttributes = (raw) => {
  const attrs = {};
  const text = String(raw || '');
  const attrRegex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = attrRegex.exec(text)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4];
    if (value === undefined) attrs[key] = true;
    else attrs[key] = value;
  }
  return attrs;
};

const buildScript = (key, attrs, content) => {
  const props = { key, ...attrs };
  if (content && String(content).length > 0) {
    props.dangerouslySetInnerHTML = { __html: String(content) };
    return React.createElement('script', props);
  }
  return React.createElement('script', props);
};

export const renderHtmlInjection = (rawHtml) => {
  const html = String(rawHtml || '').trim();
  if (!html) return null;

  const nodes = [];
  let i = 0;

  const takeTextUntil = (needleIndex) => {
    const chunk = html.slice(i, needleIndex);
    i = needleIndex;
    if (chunk.trim()) nodes.push(chunk);
  };

  while (i < html.length) {
    const nextOpen = html.indexOf('<', i);
    if (nextOpen === -1) {
      takeTextUntil(html.length);
      break;
    }
    if (nextOpen > i) takeTextUntil(nextOpen);

    const scriptOpen = html.slice(nextOpen).match(/^<script\b([^>]*)>/i);
    if (scriptOpen) {
      const attrs = parseAttributes(scriptOpen[1]);
      const openLen = scriptOpen[0].length;
      const afterOpen = nextOpen + openLen;
      const closeTag = '</script>';
      const closeIndex = html.toLowerCase().indexOf(closeTag, afterOpen);
      const content = closeIndex >= 0 ? html.slice(afterOpen, closeIndex) : '';
      i = closeIndex >= 0 ? closeIndex + closeTag.length : afterOpen;
      nodes.push(buildScript(`script-${nodes.length}`, attrs, content));
      continue;
    }

    const styleOpen = html.slice(nextOpen).match(/^<style\b([^>]*)>/i);
    if (styleOpen) {
      const attrs = parseAttributes(styleOpen[1]);
      const openLen = styleOpen[0].length;
      const afterOpen = nextOpen + openLen;
      const closeTag = '</style>';
      const closeIndex = html.toLowerCase().indexOf(closeTag, afterOpen);
      const content = closeIndex >= 0 ? html.slice(afterOpen, closeIndex) : '';
      i = closeIndex >= 0 ? closeIndex + closeTag.length : afterOpen;
      nodes.push(React.createElement('style', { key: `style-${nodes.length}`, ...attrs, dangerouslySetInnerHTML: { __html: content } }));
      continue;
    }

    const noscriptOpen = html.slice(nextOpen).match(/^<noscript\b([^>]*)>/i);
    if (noscriptOpen) {
      const attrs = parseAttributes(noscriptOpen[1]);
      const openLen = noscriptOpen[0].length;
      const afterOpen = nextOpen + openLen;
      const closeTag = '</noscript>';
      const closeIndex = html.toLowerCase().indexOf(closeTag, afterOpen);
      const content = closeIndex >= 0 ? html.slice(afterOpen, closeIndex) : '';
      i = closeIndex >= 0 ? closeIndex + closeTag.length : afterOpen;
      nodes.push(React.createElement('noscript', { key: `noscript-${nodes.length}`, ...attrs, dangerouslySetInnerHTML: { __html: content } }));
      continue;
    }

    const selfClose = html.slice(nextOpen).match(/^<(meta|link)\b([^>]*?)\/?>/i);
    if (selfClose) {
      const tag = selfClose[1].toLowerCase();
      const attrs = parseAttributes(selfClose[2]);
      i = nextOpen + selfClose[0].length;
      nodes.push(React.createElement(tag, { key: `${tag}-${nodes.length}`, ...attrs }));
      continue;
    }

    const genericSelf = html.slice(nextOpen).match(/^<(iframe|img)\b([^>]*?)\/?>/i);
    if (genericSelf) {
      const tag = genericSelf[1].toLowerCase();
      const attrs = parseAttributes(genericSelf[2]);
      i = nextOpen + genericSelf[0].length;
      nodes.push(React.createElement(tag, { key: `${tag}-${nodes.length}`, ...attrs }));
      continue;
    }

    const end = html.indexOf('>', nextOpen);
    if (end === -1) break;
    i = end + 1;
  }

  if (nodes.length === 0) return null;

  return nodes.map((n, idx) => (typeof n === 'string' ? <React.Fragment key={`text-${idx}`}>{n}</React.Fragment> : n));
};

