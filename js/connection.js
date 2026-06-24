import { TWITCH_WS_URL } from './config.js?v=0.9.14';
import { state } from './state.js?v=0.9.14';
import { addChatMessage, addSystemMessage, updateMsgCount, updateScrollResume } from './chat.js?v=0.9.14';
import { t } from './i18n.js?v=0.9.14';

const setupScreen  = document.getElementById('setup-screen');
const chatScreen   = document.getElementById('chat-screen');
const chatMessages = document.getElementById('chat-messages');
const channelName  = document.getElementById('channel-name');
const statusDot    = document.getElementById('status-dot');

export function startChat() {
  setupScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  chatMessages.innerHTML = '';
  state.messageCount = 0;
  state.unreadWhilePaused = 0;
  updateMsgCount();
  updateScrollResume();
  channelName.textContent = state.channel;
  setStatus('connecting');
  addSystemMessage(t('connecting', state.channel));

  state.ws = new WebSocket(TWITCH_WS_URL);

  state.ws.onopen = () => {
    state.ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
    if (state.isAuthenticated) {
      state.ws.send(`PASS ${state.twitchToken}`);
      state.ws.send(`NICK ${state.twitchUsername}`);
    } else {
      state.ws.send('PASS oauth:will_not_actually_work');
      state.ws.send('NICK justinfan' + Math.floor(Math.random() * 99999));
    }
    state.ws.send(`JOIN #${state.channel}`);
  };

  state.ws.onmessage = (event) => {
    const lines = event.data.split('\r\n').filter(Boolean);
    lines.forEach(handleIRCLine);
  };

  state.ws.onerror = () => {
    setStatus('error');
    addSystemMessage(t('connError'));
  };

  state.ws.onclose = () => {
    if (chatScreen.classList.contains('hidden')) return;
    setStatus('error');
    addSystemMessage(t('disconnected'));
  };
}

export function disconnect() {
  if (state.ws) {
    state.ws.onclose = null;
    state.ws.close();
    state.ws = null;
  }
}

export function showSetup() {
  setupScreen.classList.remove('hidden');
  chatScreen.classList.add('hidden');
}

function setStatus(s) {
  statusDot.className = `status-dot ${s}`;
}

function handleIRCLine(line) {
  if (line.startsWith('PING')) {
    state.ws.send('PONG :tmi.twitch.tv');
    return;
  }
  if (line.includes(`JOIN #${state.channel}`)) {
    setStatus('connected');
    addSystemMessage(t('connected', state.channel, state.isAuthenticated));
    return;
  }
  if (!line.includes('PRIVMSG')) return;
  const parsed = parseIRCMessage(line);
  if (!parsed) return;
  addChatMessage(parsed.username, parsed.text, parsed.color);
}

function parseIRCMessage(line) {
  try {
    const tagMatch = line.match(/^@([^ ]+) :(\w+)!\w+@\S+ PRIVMSG #\w+ :(.+)$/);
    if (tagMatch) {
      const tags = parseTags(tagMatch[1]);
      return {
        username: tags['display-name'] || tagMatch[2],
        text: tagMatch[3],
        color: tags['color'] || null,
      };
    }
    const noTagMatch = line.match(/:(\w+)!\w+@\S+ PRIVMSG #\w+ :(.+)$/);
    if (noTagMatch) return { username: noTagMatch[1], text: noTagMatch[2], color: null };
  } catch (e) {
    console.warn('parse error:', e);
  }
  return null;
}

function parseTags(tagStr) {
  const tags = {};
  tagStr.split(';').forEach(pair => {
    const [k, v] = pair.split('=');
    tags[k] = v || '';
  });
  return tags;
}
