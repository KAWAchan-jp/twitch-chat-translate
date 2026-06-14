import { TWITCH_CLIENT_ID, TWITCH_REDIRECT_URI } from './config.js?v=0.9.3';
import { state } from './state.js?v=0.9.3';
import { addSystemMessage } from './chat.js?v=0.9.3';
import { disconnect, startChat } from './connection.js?v=0.9.3';
import { translateText } from './translate.js?v=0.9.3';
import { t } from './i18n.js?v=0.9.3';

const authPanel    = document.getElementById('auth-panel');
const sendPanel    = document.getElementById('send-panel');
const messageInput = document.getElementById('message-input');

export function startTwitchLogin() {
  const scope = 'chat:read chat:edit';
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(scope)}`;
  const popup = window.open(url, 'twitch-oauth', 'width=480,height=650,scrollbars=yes');
  if (!popup) window.location.href = url;
}

export async function handleOAuthToken(rawToken) {
  try {
    const res = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${rawToken}`,
        'Client-Id': TWITCH_CLIENT_ID,
      }
    });
    const data = await res.json();
    state.twitchUsername  = data.data[0].login;
    state.twitchToken     = `oauth:${rawToken}`;
    state.isAuthenticated = true;
    sessionStorage.setItem('twitch_token', rawToken);
    sessionStorage.setItem('twitch_username', state.twitchUsername);

    authPanel.classList.add('hidden');
    sendPanel.classList.remove('hidden');
    sendPanel.querySelector('.send-user').textContent = state.twitchUsername;
    updateSendPlaceholder();

    if (state.channel) { disconnect(); startChat(); }
  } catch (_) {
    addSystemMessage(t('loginFail'));
  }
}

export function updateSendPlaceholder() {
  messageInput.placeholder = t(state.sourceLang === 'auto' ? 'sendPlaceholderAuto' : 'sendPlaceholder');
}

export async function sendUserMessage() {
  const text = messageInput.value.trim();
  if (!text || !state.ws || !state.isAuthenticated) return;
  messageInput.value = '';
  messageInput.focus();

  let sendText = text;
  if (state.sourceLang !== 'auto') {
    try { sendText = await translateText(text, 'auto', state.sourceLang); } catch (_) {}
  }
  state.ws.send(`PRIVMSG #${state.channel} :${sendText}`);
}
