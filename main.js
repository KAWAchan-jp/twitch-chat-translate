import { state } from './js/state.js?v=0.8.25';
import { startChat, disconnect, showSetup } from './js/connection.js?v=0.8.25';
import { scrollToBottom } from './js/chat.js?v=0.8.25';
import { startTwitchLogin, handleOAuthToken, updateSendPlaceholder, sendUserMessage } from './js/auth.js?v=0.8.25';
import { initI18n, setUiLang, getLang, t } from './js/i18n.js?v=0.8.25';
import { tryStartOverlay, copyOverlayUrl } from './js/overlay.js?v=0.8.25';
import { getBlockedUsers, addBlockedUser, removeBlockedUser } from './js/filter.js?v=0.8.25';
import { escapeHtml } from './js/utils.js?v=0.8.25';
import { getDeco, setDeco, setShow, applyDeco } from './js/deco.js?v=0.8.25';

// OAuthポップアップのコールバック検出（ポップアップ側で実行される）
{
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const oauthToken = hashParams.get('access_token');
  if (oauthToken && window.opener) {
    window.opener.postMessage({ type: 'twitch_auth', token: oauthToken }, window.location.origin);
    window.close();
  }
}

// sessionStorageからログイン状態を復元
{
  const savedToken    = sessionStorage.getItem('twitch_token');
  const savedUsername = sessionStorage.getItem('twitch_username');
  if (savedToken && savedUsername) {
    state.twitchToken     = `oauth:${savedToken}`;
    state.twitchUsername  = savedUsername;
    state.isAuthenticated = true;
  }
}

// i18n初期化（ブラウザ言語またはlocalStorageから復元）
initI18n();

// ===== DOM =====
const channelInput       = document.getElementById('channel-input');
const langSelect         = document.getElementById('lang-select');
const targetLangSelect   = document.getElementById('target-lang-select');
const connectBtn         = document.getElementById('connect-btn');
const disconnectBtn      = document.getElementById('disconnect-btn');
const headerSrcLang      = document.getElementById('header-src-lang');
const headerTgtLang      = document.getElementById('header-tgt-lang');
const fontFamilySelect   = document.getElementById('font-family-select');
const fontSizeSelect     = document.getElementById('font-size-select');
const settingsBtn        = document.getElementById('settings-btn');
const settingsDropdown   = document.getElementById('settings-dropdown');
const autoScrollCb       = document.getElementById('auto-scroll');
const hideBotsCb         = document.getElementById('hide-bots');
const chatContainer      = document.getElementById('chat-container');
const experimentalToggle = document.getElementById('experimental-toggle');
const chatInputArea      = document.getElementById('chat-input-area');
const authPanel          = document.getElementById('auth-panel');
const sendPanel          = document.getElementById('send-panel');
const twitchLoginBtn     = document.getElementById('twitch-login-btn');
const messageInput       = document.getElementById('message-input');
const sendBtn            = document.getElementById('send-btn');
const logoutBtn          = document.getElementById('logout-btn');
const copyObsBtn         = document.getElementById('copy-obs-url');
const openBlocklistBtn   = document.getElementById('open-blocklist');
const blocklistModal     = document.getElementById('blocklist-modal');
const blocklistClose     = document.getElementById('blocklist-close');
const blocklistInput     = document.getElementById('blocklist-input');
const blocklistAddBtn    = document.getElementById('blocklist-add');
const blocklistItems     = document.getElementById('blocklist-items');
const openDecoBtn        = document.getElementById('open-deco');
const decoModal          = document.getElementById('deco-modal');
const decoClose          = document.getElementById('deco-close');
const decoPresets        = document.querySelectorAll('.deco-preset');
const decoShowUser       = document.getElementById('deco-show-username');
const decoShowTime       = document.getElementById('deco-show-time');
const decoShowOrig       = document.getElementById('deco-show-original');
const decoShowTrans      = document.getElementById('deco-show-translated');
const decoEffect         = document.getElementById('deco-effect');
const decoChromaKey      = document.getElementById('deco-chroma-key');
const decoCss            = document.getElementById('deco-css');

// ===== UI言語変更 =====
function onUiLangChange(lang) {
  setUiLang(lang);
  // 翻訳先を選択したUI言語に合わせる
  const hasOption = [...targetLangSelect.options].some(o => o.value === lang);
  if (hasOption) {
    targetLangSelect.value = lang;
    state.targetLang = lang;
  }
  const hasHeaderOption = [...headerTgtLang.options].some(o => o.value === lang);
  if (hasHeaderOption) {
    headerTgtLang.value = lang;
    state.targetLang = lang;
  }
  updateSendPlaceholder();
}

document.querySelectorAll('.ui-lang-select').forEach(sel => {
  sel.addEventListener('change', () => onUiLangChange(sel.value));
});

// ===== 接続処理 =====
connectBtn.addEventListener('click', () => {
  const raw = channelInput.value.trim().toLowerCase().replace(/^#/, '');
  if (!raw) { channelInput.focus(); return; }
  state.channel    = raw;
  state.sourceLang = langSelect.value;
  state.targetLang = targetLangSelect.value;
  headerSrcLang.value = state.sourceLang;
  headerTgtLang.value = state.targetLang;
  startChat();
});

channelInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') connectBtn.click();
});

disconnectBtn.addEventListener('click', () => {
  disconnect();
  showSetup();
});

headerSrcLang.addEventListener('change', () => {
  state.sourceLang = headerSrcLang.value;
  updateSendPlaceholder();
});
headerTgtLang.addEventListener('change', () => {
  state.targetLang = headerTgtLang.value;
});

fontFamilySelect.addEventListener('change', () => {
  document.documentElement.style.setProperty('--font-chat', fontFamilySelect.value);
});
fontSizeSelect.addEventListener('change', () => {
  document.documentElement.style.setProperty('--chat-font-size', fontSizeSelect.value);
});

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = !settingsDropdown.classList.contains('hidden');
  settingsDropdown.classList.toggle('hidden', open);
  settingsBtn.classList.toggle('active', !open);
});

document.addEventListener('click', (e) => {
  if (!settingsDropdown.classList.contains('hidden') && !settingsDropdown.contains(e.target)) {
    settingsDropdown.classList.add('hidden');
    settingsBtn.classList.remove('active');
  }
});

autoScrollCb.addEventListener('change', () => {
  state.autoScroll = autoScrollCb.checked;
  if (state.autoScroll) scrollToBottom();
});

hideBotsCb.addEventListener('change', () => {
  state.hideBots = hideBotsCb.checked;
});

chatContainer.addEventListener('scroll', () => {
  const atBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 60;
  if (!atBottom && autoScrollCb.checked) {
    autoScrollCb.checked = false;
    state.autoScroll = false;
  }
  if (atBottom && !autoScrollCb.checked) {
    autoScrollCb.checked = true;
    state.autoScroll = true;
  }
});

// ===== 実験的: 送信機能 =====
experimentalToggle.addEventListener('change', () => {
  if (experimentalToggle.checked) {
    chatInputArea.classList.remove('hidden');
    if (state.isAuthenticated) {
      authPanel.classList.add('hidden');
      sendPanel.classList.remove('hidden');
      sendPanel.querySelector('.send-user').textContent = state.twitchUsername;
      updateSendPlaceholder();
    }
  } else {
    chatInputArea.classList.add('hidden');
  }
});

twitchLoginBtn.addEventListener('click', startTwitchLogin);

window.addEventListener('message', (e) => {
  if (e.data?.type === 'twitch_auth' && e.data.token) {
    handleOAuthToken(e.data.token);
  }
});

logoutBtn.addEventListener('click', () => {
  state.isAuthenticated = false;
  state.twitchUsername  = '';
  state.twitchToken     = '';
  sessionStorage.removeItem('twitch_token');
  sessionStorage.removeItem('twitch_username');
  sendPanel.classList.add('hidden');
  authPanel.classList.remove('hidden');
  if (state.channel) { disconnect(); startChat(); }
});

sendBtn.addEventListener('click', () => sendUserMessage());
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendUserMessage();
});

// ===== 除外ユーザー管理 =====
function renderBlocklist() {
  const users = getBlockedUsers();
  if (!users.length) {
    blocklistItems.innerHTML = `<div class="blocklist-empty">${t('blocklistEmpty')}</div>`;
    return;
  }
  blocklistItems.innerHTML = users.map(u =>
    `<div class="blocklist-item"><span>${escapeHtml(u)}</span>` +
    `<button class="blocklist-remove" data-user="${escapeHtml(u)}" aria-label="remove">×</button></div>`
  ).join('');
}

function addFromInput() {
  const added = addBlockedUser(blocklistInput.value);
  if (added) { blocklistInput.value = ''; renderBlocklist(); }
  blocklistInput.focus();
}

openBlocklistBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsDropdown.classList.add('hidden');
  settingsBtn.classList.remove('active');
  renderBlocklist();
  blocklistModal.classList.remove('hidden');
  blocklistInput.focus();
});

blocklistClose.addEventListener('click', () => blocklistModal.classList.add('hidden'));
blocklistModal.addEventListener('click', (e) => {
  if (e.target === blocklistModal) blocklistModal.classList.add('hidden');
});

blocklistAddBtn.addEventListener('click', addFromInput);
blocklistInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addFromInput();
});

blocklistItems.addEventListener('click', (e) => {
  const btn = e.target.closest('.blocklist-remove');
  if (!btn) return;
  removeBlockedUser(btn.dataset.user);
  renderBlocklist();
});

// ===== 装飾設定 =====
function syncDecoUI() {
  const d = getDeco();
  decoPresets.forEach(b => b.classList.toggle('active', b.dataset.theme === d.theme));
  decoShowUser.checked  = d.show.username;
  decoShowTime.checked  = d.show.time;
  decoShowOrig.checked  = d.show.original;
  decoShowTrans.checked = d.show.translated;
  decoEffect.value = d.effect;
  decoChromaKey.value = d.chromaKey || '#00ff00';
  decoCss.value = d.css;
}

openDecoBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsDropdown.classList.add('hidden');
  settingsBtn.classList.remove('active');
  syncDecoUI();
  decoModal.classList.remove('hidden');
});
decoClose.addEventListener('click', () => decoModal.classList.add('hidden'));
decoModal.addEventListener('click', (e) => {
  if (e.target === decoModal) decoModal.classList.add('hidden');
});

decoPresets.forEach(btn => {
  btn.addEventListener('click', () => {
    setDeco({ theme: btn.dataset.theme });
    decoPresets.forEach(b => b.classList.toggle('active', b === btn));
  });
});
decoShowUser.addEventListener('change',  () => setShow('username',   decoShowUser.checked));
decoShowTime.addEventListener('change',  () => setShow('time',       decoShowTime.checked));
decoShowOrig.addEventListener('change',  () => setShow('original',   decoShowOrig.checked));
decoShowTrans.addEventListener('change', () => setShow('translated', decoShowTrans.checked));
decoEffect.addEventListener('change', () => setDeco({ effect: decoEffect.value }));
decoChromaKey.addEventListener('input', () => setDeco({ chromaKey: decoChromaKey.value }));
decoCss.addEventListener('input', () => setDeco({ css: decoCss.value }));

// ===== OBSオーバーレイ =====
copyObsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  copyOverlayUrl(copyObsBtn);
});

// 保存済みの装飾を反映してから、?overlay=1 ならオーバーレイ起動（URLの設定が優先）
applyDeco();
tryStartOverlay(startChat);
