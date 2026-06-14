import { TRANSLATE_SKIP_PATTERNS, TRANSLATE_CACHE_MAX } from './config.js?v=0.8.19';

// 翻訳結果キャッシュ（同じ文・コピペの再翻訳を防ぐ）
// MapはInsertion orderを保持するため、上限超過時は最古エントリを削除（簡易LRU）
const cache = new Map();

async function fetchTranslation(text, from, to) {
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

// キャッシュ済みなら翻訳結果を返す（未ヒットはundefined）。同期関数
export function getCachedTranslation(text, from, to) {
  const key = `${from}:${to}:${text}`;
  if (!cache.has(key)) return undefined;
  // ヒットしたら末尾へ移動（最近使用＝削除されにくくする）
  const cached = cache.get(key);
  cache.delete(key);
  cache.set(key, cached);
  return cached;
}

export async function translateText(text, from, to) {
  const key = `${from}:${to}:${text}`;

  const hit = getCachedTranslation(text, from, to);
  if (hit !== undefined) return hit;

  const translated = await fetchTranslation(text, from, to);

  cache.set(key, translated);
  if (cache.size > TRANSLATE_CACHE_MAX) {
    cache.delete(cache.keys().next().value); // 最古を削除
  }
  return translated;
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
