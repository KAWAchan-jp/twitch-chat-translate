import { MAX_MESSAGES, TRANSLATE_DELAY_MS } from './config.js?v=0.9.10';
import { state } from './state.js?v=0.9.10';
import { escapeHtml, sleep } from './utils.js?v=0.9.10';
import { translateText, getCachedTranslation, shouldSkipTranslation, detectEmoteSpam } from './translate.js?v=0.9.10';
import { isBotOrCommand } from './filter.js?v=0.9.10';
import { t } from './i18n.js?v=0.9.10';
import { getDeco } from './deco.js?v=0.9.10';

const chatMessages  = document.getElementById('chat-messages');
const chatContainer = document.getElementById('chat-container');
const msgCountEl    = document.getElementById('msg-count');
const resumeBtn     = document.getElementById('scroll-resume-btn');
const resumeCountEl = document.getElementById('scroll-resume-count');

export function addChatMessage(username, text, color) {
  // bot・コマンドの除外（設定ON時）
  if (state.hideBots && isBotOrCommand(username, text)) return;

  const el = document.createElement('div');
  el.className = 'chat-msg';
  el.classList.add(Math.random() < 0.5 ? 'speech-left' : 'speech-right');

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
