import { state } from './state.js?v=0.8.23';
import { t } from './i18n.js?v=0.8.23';
import { encodeDeco, applyDecoFrom } from './deco.js?v=0.8.23';

// 現在の設定からOBS用オーバーレイURLを生成
export function buildOverlayUrl() {
  const params = new URLSearchParams();
  params.set('overlay', '1');
  params.set('channel', state.channel);
  params.set('src', state.sourceLang);
  params.set('tgt', state.targetLang);

  const fontSize   = document.getElementById('font-size-select')?.value;
  const fontFamily = document.getElementById('font-family-select')?.value;
  if (fontSize)   params.set('size', fontSize);
  if (fontFamily) params.set('font', fontFamily);
  params.set('deco', encodeDeco());

  return `${location.origin}${location.pathname}?${params.toString()}`;
}

// URLをクリップボードへコピーし、ボタンに一時フィードバックを表示
export async function copyOverlayUrl(btn) {
  const url = buildOverlayUrl();
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  btn.textContent = t('copied');
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = t('copyObsUrl');
    btn.classList.remove('copied');
  }, 1500);
}

// URLパラメータからオーバーレイモードを起動。起動したらtrueを返す
export function tryStartOverlay(startChat) {
  const params = new URLSearchParams(location.search);
  if (params.get('overlay') !== '1') return false;

  document.documentElement.classList.add('overlay-mode');

  state.sourceLang = params.get('src') || 'en';
  state.targetLang = params.get('tgt') || 'ja';

  const headerSrcLang = document.getElementById('header-src-lang');
  const headerTgtLang = document.getElementById('header-tgt-lang');
  if (headerSrcLang) headerSrcLang.value = state.sourceLang;
  if (headerTgtLang) headerTgtLang.value = state.targetLang;

  const size = params.get('size');
  const font = params.get('font');
  if (size) document.documentElement.style.setProperty('--chat-font-size', size);
  if (font) document.documentElement.style.setProperty('--font-chat', font);
  const decoParam = params.get('deco');
  if (decoParam) applyDecoFrom(decoParam);

  const ch = (params.get('channel') || '').toLowerCase().replace(/^#/, '');
  if (ch) {
    state.channel = ch;
    startChat();
  }
  return true;
}
