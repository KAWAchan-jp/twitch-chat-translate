// 装飾設定（プリセット・表示要素・エフェクト・カスタムCSS）の管理

const LS_KEY = 'deco_config';

const CSS_COMMENTS = {
  ja: ['BOXテーマのカスタマイズ', '以下の値を変更してデザインを調整できます。', '背景・枠線・角丸', '背景色', '左ラインの色', '角の丸み', '文字色', '翻訳文', '原文', 'ユーザー名'],
  en: ['BOX theme customization', 'Change the values below to customize the design.', 'Background, border, and corner radius', 'Background color', 'Left border color', 'Corner radius', 'Text colors', 'Translation', 'Original', 'Username'],
  ko: ['BOX 테마 사용자 지정', '아래 값을 변경하여 디자인을 조정할 수 있습니다.', '배경, 테두리 및 모서리', '배경색', '왼쪽 테두리 색상', '모서리 반경', '글자색', '번역', '원문', '사용자 이름'],
  'zh-CN': ['BOX 主题自定义', '修改以下值以调整设计。', '背景、边框和圆角', '背景色', '左侧边框颜色', '圆角大小', '文字颜色', '翻译', '原文', '用户名'],
  'zh-TW': ['BOX 主題自訂', '修改以下數值以調整設計。', '背景、邊框與圓角', '背景色', '左側邊框顏色', '圓角大小', '文字顏色', '翻譯', '原文', '使用者名稱'],
  es: ['Personalización del tema BOX', 'Cambia los valores siguientes para ajustar el diseño.', 'Fondo, borde y esquinas', 'Color de fondo', 'Color del borde izquierdo', 'Radio de las esquinas', 'Colores del texto', 'Traducción', 'Original', 'Nombre de usuario'],
  fr: ['Personnalisation du thème BOX', 'Modifiez les valeurs ci-dessous pour ajuster le design.', 'Fond, bordure et coins', 'Couleur de fond', 'Couleur de la bordure gauche', 'Rayon des coins', 'Couleurs du texte', 'Traduction', 'Original', "Nom d'utilisateur"],
  de: ['BOX-Theme anpassen', 'Ändere die folgenden Werte, um das Design anzupassen.', 'Hintergrund, Rahmen und Ecken', 'Hintergrundfarbe', 'Farbe des linken Rahmens', 'Eckenradius', 'Textfarben', 'Übersetzung', 'Original', 'Benutzername'],
  pt: ['Personalização do tema BOX', 'Altere os valores abaixo para ajustar o design.', 'Fundo, borda e cantos', 'Cor de fundo', 'Cor da borda esquerda', 'Raio dos cantos', 'Cores do texto', 'Tradução', 'Original', 'Nome de usuário'],
  ru: ['Настройка темы BOX', 'Измените значения ниже, чтобы настроить оформление.', 'Фон, рамка и углы', 'Цвет фона', 'Цвет левой рамки', 'Радиус углов', 'Цвета текста', 'Перевод', 'Оригинал', 'Имя пользователя'],
  id: ['Kustomisasi tema BOX', 'Ubah nilai di bawah untuk menyesuaikan desain.', 'Latar, bingkai, dan sudut', 'Warna latar', 'Warna bingkai kiri', 'Radius sudut', 'Warna teks', 'Terjemahan', 'Asli', 'Nama pengguna'],
};

export function getDefaultCss(lang = 'en') {
  const c = CSS_COMMENTS[lang] || CSS_COMMENTS.en;
  return `/* === ${c[0]} ===
   ${c[1]} */

/* ${c[2]} */
html.deco-theme-box .chat-msg {
  /* ${c[3]} */
  background: #000000 !important;

  /* ${c[4]} */
  border-left-color: #9147ff !important;

  /* ${c[5]} */
  border-radius: 6px !important;
}

/* ${c[6]} */
/* ${c[7]} */
html.deco-theme-box .msg-translated { color: #ffffff; }

/* ${c[8]} */
html.deco-theme-box .msg-original { color: #cccccc; }

/* ${c[9]} */
html.deco-theme-box .msg-username { color: #ffce00 !important; }`;
}

const DEFAULT_CSS = getDefaultCss('en');

const DEFAULT = {
  theme: 'plain',        // plain | box | separator | bubble | glass | neon | compact | terminal | minimal | card | broadcast | pastel
  show: { username: true, time: true, original: true, translated: true },
  effect: 'fade',        // none | fade | slide | pop | rise | drop | glow | flip | blur | bounce | wipe | flash
  css: DEFAULT_CSS,      // カスタムCSS（テンプレート）
  cssEdited: false,
  messageBackground: null,
  messageTranslated: null,
  messageOriginal: null,
  messageUsername: null,
  messageGap: 0,
  expireEffect: 'none',
  expireSeconds: 10,
  chromaKey: '#00ff00',  // OBSクロマキー背景色
};

let deco = load();
let styleEl = null;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    const isLegacyDefaultCss = saved.css?.includes('/* === BOX テーマ カスタマイズ ===');
    if (isLegacyDefaultCss) {
      saved.css = saved.css
        .replace('background: var(--box-background) !important;', 'background: #000000 !important;')
        .replace('color: var(--box-translated);', 'color: #ffffff;')
        .replace('color: var(--box-original);', 'color: #cccccc;')
        .replace('color: var(--box-username) !important;', 'color: #ffce00 !important;');
    }
    if (saved.cssEdited === undefined) {
      saved.cssEdited = isLegacyDefaultCss || Object.keys(CSS_COMMENTS).some(lang => saved.css === getDefaultCss(lang))
        ? false
        : Boolean(saved.css);
    }
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

export function syncDefaultCssLanguage(lang) {
  if (deco.cssEdited) return false;
  deco = { ...deco, css: getDefaultCss(lang) };
  persist();
  applyDeco();
  return true;
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
  if (deco.messageBackground) {
    h.classList.add('deco-custom-message-background');
    h.style.setProperty('--message-background', deco.messageBackground);
  } else {
    h.style.removeProperty('--message-background');
  }
  for (const [key, cssName] of [
    ['messageTranslated', 'message-translated'],
    ['messageOriginal', 'message-original'],
    ['messageUsername', 'message-username'],
  ]) {
    if (deco[key]) {
      h.classList.add('deco-custom-' + cssName);
      h.style.setProperty('--' + cssName, deco[key]);
    } else {
      h.style.removeProperty('--' + cssName);
    }
  }
  h.style.setProperty('--message-gap', `${Number(deco.messageGap) || 0}px`);
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
