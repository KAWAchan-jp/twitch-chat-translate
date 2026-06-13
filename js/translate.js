import { TRANSLATE_SKIP_PATTERNS } from './config.js';

export async function translateText(text, from, to) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('translate failed');
    const data = await res.json();
    return (data[0] ?? []).map(item => item?.[0]).filter(Boolean).join('') || text;
  } finally {
    clearTimeout(timer);
  }
}

export function shouldSkipTranslation(text) {
  return TRANSLATE_SKIP_PATTERNS.some(p => p.test(text));
}

// 同じ単語が3回以上繰り返されていたらエモートスパムと判定
export function detectEmoteSpam(text) {
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return null;
  const first = words[0];
  if (words.every(w => w === first)) return { emote: first, count: words.length };
  return null;
}
