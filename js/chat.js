import { MAX_MESSAGES, TRANSLATE_DELAY_MS } from './config.js?v=0.8.18';
import { state } from './state.js?v=0.8.18';
import { escapeHtml, sleep } from './utils.js?v=0.8.18';
import { translateText, getCachedTranslation, shouldSkipTranslation, detectEmoteSpam } from './translate.js?v=0.8.18';
import { isBotOrCommand } from './filter.js?v=0.8.18';
import { t } from './i18n.js?v=0.8.18';

const chatMessages  = document.getElementById('chat-messages');
const chatContainer = document.getElementById('chat-container');
const msgCountEl    = document.getElementById('msg-count');

export function addChatMessage(username, text, color) {
  // bot・コマンドの除外（設定ON時）
  if (state.hideBots && isBotOrCommand(username, text)) return;

  const el = document.createElement('div');
  el.className = 'chat-msg';

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
  trimMessages();
  state.messageCount++;
  updateMsgCount();
  if (state.autoScroll) scrollToBottom();

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
  if (state.autoScroll) scrollToBottom();
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
