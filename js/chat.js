import { MAX_MESSAGES, TRANSLATE_DELAY_MS } from './config.js?v=0.9.6';
import { state } from './state.js?v=0.9.6';
import { escapeHtml, sleep } from './utils.js?v=0.9.6';
import { translateText, getCachedTranslation, shouldSkipTranslation, detectEmoteSpam } from './translate.js?v=0.9.6';
import { isBotOrCommand } from './filter.js?v=0.9.6';
import { t } from './i18n.js?v=0.9.6';
import { getDeco } from './deco.js?v=0.9.6';

const chatMessages  = document.getElementById('chat-messages');
const chatContainer = document.getElementById('chat-container');
const msgCountEl    = document.getElementById('msg-count');
const resumeBtn     = document.getElementById('scroll-resume-btn');
const resumeCountEl = document.getElementById('scroll-resume-count');

// Speechプリセット用カラーパレット（7色）
const SPEECH_COLORS = [
  { bg: '#1e1630', border: 'rgba(145,71,255,0.55)',  shadow: 'rgba(145,71,255,0.15)',  username: '#b575ff', translated: '#ecdcff', original: 'rgba(210,185,255,0.65)' },
  { bg: '#0d1c2e', border: 'rgba(70,155,245,0.55)',  shadow: 'rgba(70,155,245,0.15)',  username: '#4e9bf5', translated: '#d6eaff', original: 'rgba(170,210,255,0.65)' },
  { bg: '#0e2220', border: 'rgba(40,195,175,0.55)',  shadow: 'rgba(40,195,175,0.15)',  username: '#28c3af', translated: '#ccf5f0', original: 'rgba(150,235,225,0.65)' },
  { bg: '#2a0e1e', border: 'rgba(235,70,155,0.55)',  shadow: 'rgba(235,70,155,0.15)',  username: '#eb469b', translated: '#ffd8ee', original: 'rgba(255,190,225,0.65)' },
  { bg: '#0d2010', border: 'rgba(65,195,90,0.55)',   shadow: 'rgba(65,195,90,0.15)',   username: '#41c35a', translated: '#d2f5d8', original: 'rgba(160,235,175,0.65)' },
  { bg: '#251608', border: 'rgba(240,145,50,0.55)',  shadow: 'rgba(240,145,50,0.15)',  username: '#f09132', translated: '#ffebd4', original: 'rgba(255,215,175,0.65)' },
  { bg: '#201c08', border: 'rgba(215,195,50,0.55)',  shadow: 'rgba(215,195,50,0.15)',  username: '#d7c332', translated: '#faf5cc', original: 'rgba(240,225,150,0.65)' },
];

// Speechバブルのモコモコborder-radiusをランダム生成（テール角は小さく固定）
function speechRadius(isLeft) {
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const tail = ri(6, 10);
  const x = isLeft
    ? [tail,      ri(18,30), ri(16,28), ri(14,26)]
    : [ri(18,30), tail,      ri(14,26), ri(16,28)];
  const y = isLeft
    ? [tail,      ri(16,26), ri(18,30), ri(14,24)]
    : [ri(16,26), tail,      ri(14,24), ri(18,30)];
  return `${x.map(v => v + 'px').join(' ')} / ${y.map(v => v + 'px').join(' ')}`;
}

export function addChatMessage(username, text, color) {
  // bot・コマンドの除外（設定ON時）
  if (state.hideBots && isBotOrCommand(username, text)) return;

  const el = document.createElement('div');
  el.className = 'chat-msg';
  const isLeft = Math.random() < 0.5;
  el.classList.add(isLeft ? 'speech-left' : 'speech-right');
  const sc = SPEECH_COLORS[Math.floor(Math.random() * SPEECH_COLORS.length)];
  el.style.setProperty('--speech-bg',         sc.bg);
  el.style.setProperty('--speech-border',     sc.border);
  el.style.setProperty('--speech-shadow',     sc.shadow);
  el.style.setProperty('--speech-username',   sc.username);
  el.style.setProperty('--speech-translated', sc.translated);
  el.style.setProperty('--speech-original',   sc.original);
  el.style.setProperty('--speech-radius',     speechRadius(isLeft));

  const now = new Date();
  const time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const usernameColor = color || '#f0b429';

  el.innerHTML = `
    <div class="msg-meta">
      <span class="msg-username" style="color:${usernameColor}">${escapeHtml(username)}</span>
      <span class="msg-time">${time}</span>
    </div>
    <div class="msg-original">${escapeHtml(text)}</div>
    <div class="msg-translated translating">${t('translating')}</div>
  `;

  chatMessages.appendChild(el);
  scheduleMessageExpiry(el);
  trimMessages();
  state.messageCount++;
  updateMsgCount();
  handleNewMessageScroll();

  const translatedEl = el.querySelector('.msg-translated');

  const spam = detectEmoteSpam(text);
  if (spam) {
    translatedEl.innerHTML = `<span class="emote-badge">🎴 スタンプ</span> ${escapeHtml(spam.emote)} <span class="emote-count">×${spam.count}</span>`;
    translatedEl.classList.remove('translating');
    return;
  }

  if (shouldSkipTranslation(text)) {
    translatedEl.textContent = text;
    translatedEl.classList.remove('translating');
    return;
  }

  // キャッシュヒットならAPI遅延キューをスキップして即時表示
  const cached = getCachedTranslation(text, state.sourceLang, state.targetLang);
  if (cached !== undefined) {
    translatedEl.textContent = cached;
    translatedEl.classList.remove('translating');
    translatedEl.classList.add('ja');
    return;
  }

  state.translateQueue = state.translateQueue.then(() =>
    sleep(TRANSLATE_DELAY_MS)
      .then(() => translateText(text, state.sourceLang, state.targetLang))
      .then(translated => {
        translatedEl.textContent = translated;
        translatedEl.classList.remove('translating');
        translatedEl.classList.add('ja');
        if (state.autoScroll) scrollToBottom();
      })
      .catch(() => {
        translatedEl.textContent = text + t('translateFail');
        translatedEl.classList.remove('translating');
      })
  ).catch(() => {});
}

export function addSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'chat-msg system';
  el.innerHTML = `<div class="msg-translated">${escapeHtml(text)}</div>`;
  chatMessages.appendChild(el);
  handleNewMessageScroll();
}

function scheduleMessageExpiry(el) {
  const deco = getDeco();
  if (deco.expireEffect === 'none') return;

  const seconds = Math.max(1, Number(deco.expireSeconds) || 10);
  window.setTimeout(() => {
    if (!el.isConnected) return;
    el.classList.add('deco-expire', `deco-expire-${deco.expireEffect}`);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    window.setTimeout(() => el.remove(), 1000);
  }, seconds * 1000);
}

export function trimMessages() {
  while (chatMessages.children.length > MAX_MESSAGES) {
    chatMessages.removeChild(chatMessages.firstChild);
  }
}

export function updateMsgCount() {
  msgCountEl.dataset.count = state.messageCount;
  msgCountEl.textContent = t('msgCount', state.messageCount);
}

export function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

export function handleNewMessageScroll() {
  if (state.autoScroll) {
    scrollToBottom();
    return;
  }
  state.unreadWhilePaused++;
  updateScrollResume();
}

export function updateScrollResume() {
  if (!resumeBtn || !resumeCountEl) return;
  const shouldShow = !state.autoScroll;
  resumeBtn.classList.toggle('hidden', !shouldShow);
  resumeCountEl.textContent = state.unreadWhilePaused > 0 ? String(state.unreadWhilePaused) : '';
}

export function resumeAutoScroll() {
  state.autoScroll = true;
  state.unreadWhilePaused = 0;
  scrollToBottom();
  updateScrollResume();
}
