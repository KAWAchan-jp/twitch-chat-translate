import { state } from './js/state.js';
import { startChat, disconnect, showSetup } from './js/connection.js';
import { scrollToBottom } from './js/chat.js';
import { startTwitchLogin, handleOAuthToken, updateSendPlaceholder, sendUserMessage } from './js/auth.js';

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
const showOrigCb         = document.getElementById('show-original');
const autoScrollCb       = document.getElementById('auto-scroll');
const chatContainer      = document.getElementById('chat-container');
const experimentalToggle = document.getElementById('experimental-toggle');
const chatInputArea      = document.getElementById('chat-input-area');
const authPanel          = document.getElementById('auth-panel');
const sendPanel          = document.getElementById('send-panel');
const twitchLoginBtn     = document.getElementById('twitch-login-btn');
const messageInput       = document.getElementById('message-input');
const sendBtn            = document.getElementById('send-btn');
const logoutBtn          = document.getElementById('logout-btn');

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

showOrigCb.addEventListener('change', () => {
  document.querySelectorAll('.msg-original').forEach(el => {
    el.classList.toggle('hidden-orig', !showOrigCb.checked);
  });
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
