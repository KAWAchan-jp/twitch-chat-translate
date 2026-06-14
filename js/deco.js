// 装飾設定（プリセット・表示要素・エフェクト・カスタムCSS）の管理

const LS_KEY = 'deco_config';

const DEFAULT = {
  theme: 'plain',        // plain | box | separator | bubble
  show: { username: true, time: true, original: true, translated: true },
  effect: 'fade',        // none | fade | slide | pop
  css: '',               // カスタムCSS
  chromaKey: '#00ff00',  // OBSクロマキー背景色
};

let deco = load();
let styleEl = null;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return { ...DEFAULT, ...saved, show: { ...DEFAULT.show, ...(saved.show || {}) } };
  } catch {
    return { ...DEFAULT, show: { ...DEFAULT.show } };
  }
}

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify(deco));
}

export function getDeco() {
  return deco;
}

// 部分更新（theme / effect / css など）
export function setDeco(patch) {
  deco = { ...deco, ...patch };
  persist();
  applyDeco();
}

// 表示要素の個別更新
export function setShow(key, value) {
  deco.show = { ...deco.show, [key]: value };
  persist();
  applyDeco();
}

// UTF-8対応のbase64エンコード／デコード
export function encodeDeco(d = deco) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(d))));
}

export function decodeDeco(s) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(s))));
    return { ...DEFAULT, ...d, show: { ...DEFAULT.show, ...(d.show || {}) } };
  } catch {
    return null;
  }
}

// URLパラメータから装飾を復元して適用（OBSオーバーレイ用）
export function applyDecoFrom(s) {
  const d = decodeDeco(s);
  if (d) { deco = d; applyDeco(); }
}

// 現在の装飾設定をDOMへ反映
export function applyDeco() {
  const h = document.documentElement;
  [...h.classList].forEach(c => { if (c.startsWith('deco-')) h.classList.remove(c); });
  h.classList.add('deco-theme-' + deco.theme, 'deco-fx-' + deco.effect);
  h.style.setProperty('--chroma-key-color', deco.chromaKey || '#00ff00');
  if (!deco.show.username)   h.classList.add('deco-hide-username');
  if (!deco.show.time)       h.classList.add('deco-hide-time');
  if (!deco.show.original)   h.classList.add('deco-hide-original');
  if (!deco.show.translated) h.classList.add('deco-hide-translated');

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'deco-custom';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = deco.css || '';
}
