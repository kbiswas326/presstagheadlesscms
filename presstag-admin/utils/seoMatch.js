export function normalizeForMatch(value) {
  let s = String(value ?? '');
  if (!s) return '';
  s = s.replace(/[\u2018\u2019\u201B\u2032\u2035`´]/g, "'").replace(/[\u201C\u201D\u201F\u2033\u2036]/g, '"');
  try {
    s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  } catch {}
  s = s.replace(/['"]/g, '');
  s = s.toLowerCase();
  s = s.replace(/&/g, ' and ');
  s = s.replace(/[_/]+/g, ' ');
  s = s.replace(/-+/g, ' ');
  s = s.replace(/[^a-z0-9]+/g, ' ');
  s = s.trim().replace(/\s+/g, ' ');
  return s;
}

export function slugifyForMatch(value) {
  const s = normalizeForMatch(value);
  if (!s) return '';
  return s.replace(/\s+/g, '-');
}

export function includesNormalized(haystack, needle) {
  const h = normalizeForMatch(haystack);
  const n = normalizeForMatch(needle);
  if (!h || !n) return false;
  return h.includes(n);
}

export function countPhraseOccurrences(text, phrase) {
  const tokens = normalizeForMatch(text).split(' ').filter(Boolean);
  const phraseTokens = normalizeForMatch(phrase).split(' ').filter(Boolean);
  if (tokens.length === 0 || phraseTokens.length === 0) return 0;
  if (phraseTokens.length > tokens.length) return 0;

  let count = 0;
  for (let i = 0; i <= tokens.length - phraseTokens.length; i += 1) {
    let ok = true;
    for (let j = 0; j < phraseTokens.length; j += 1) {
      if (tokens[i + j] !== phraseTokens[j]) {
        ok = false;
        break;
      }
    }
    if (ok) count += 1;
  }
  return count;
}

export function keywordDensity(text, keyword) {
  const tokens = normalizeForMatch(text).split(' ').filter(Boolean);
  const words = tokens.length;
  if (!words) return 0;
  const occurrences = countPhraseOccurrences(text, keyword);
  return (occurrences / words) * 100;
}

