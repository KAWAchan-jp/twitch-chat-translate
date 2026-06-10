'use strict';

// ===== 設定 =====
const TWITCH_WS_URL = 'wss://irc-ws.chat.twitch.tv:443';
const MAX_MESSAGES = 200;       // 画面に保持するメッセージ最大数
const TRANSLATE_DELAY_MS = 100; // 翻訳リクエスト間の最小間隔(ms)
const TRANSLATE_SKIP_PATTERNS = [
  /^[!\/]/,              // コマンド (!ban, /me など)
  /^[^\p{L}\p{N}]+$/u,  // 文字・数字を含まない（記号・絵文字のみ）
];

// ===== 状態 =====
let ws = null;
let channel = '';
let sourceLang = 'en';
let targetLang = 'ja';
let messageCount = 0;
let translateQueue = Promise.resolve();
let autoScroll = true;

// ===== DOM =====
const setupScreen   = document.getElementById('setup-screen');
const chatScreen    = document.getElementById('chat-screen');
const channelInput  = document.getElementById('channel-input');
const langSelect    = document.getElementById('lang-select');
const connectBtn    = document.getElementById('connect-btn');
const channelName   = document.getElementById('channel-name');
const statusDot     = document.getElementById('status-dot');
const chatMessages  = document.getElementById('chat-messages');
const chatContainer = document.getElementById('chat-container');
const msgCountEl    = document.getElementById('msg-count');
const disconnectBtn = document.getElementById('disconnect-btn');
const showOrigCb       = document.getElementById('show-original');
const autoScrollCb     = document.getElementById('auto-scroll');
const queueInfo        = document.getElementById('translate-queue-info');
const targetLangSelect = document.getElementById('target-lang-select');
const headerSrcLang    = document.getElementById('header-src-lang');
const headerTgtLang    = document.getElementById('header-tgt-lang');

// ===== 接続処理 =====
connectBtn.addEventListener('click', () => {
  const raw = channelInput.value.trim().toLowerCase().replace(/^#/, '');
  if (!raw) { channelInput.focus(); return; }
  channel = raw;
  sourceLang = langSelect.value;
  targetLang = targetLangSelect.value;
  headerSrcLang.value = sourceLang;
  headerTgtLang.value = targetLang;
  startChat();
});

channelInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') connectBtn.click();
});

disconnectBtn.addEventListener('click', () => {
  disconnect();
  showSetup();
});

headerSrcLang.addEventListener('change', () => { sourceLang = headerSrcLang.value; });
headerTgtLang.addEventListener('change', () => { targetLang = headerTgtLang.value; });

autoScrollCb.addEventListener('change', () => {
  autoScroll = autoScrollCb.checked;
  if (autoScroll) scrollToBottom();
});

showOrigCb.addEventListener('change', () => {
  const origEls = document.querySelectorAll('.msg-original');
  origEls.forEach(el => el.classList.toggle('hidden-orig', !showOrigCb.checked));
});

chatContainer.addEventListener('scroll', () => {
  const el = chatContainer;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  if (!atBottom && autoScrollCb.checked) {
    autoScrollCb.checked = false;
    autoScroll = false;
  }
  if (atBottom && !autoScrollCb.checked) {
    autoScrollCb.checked = true;
    autoScroll = true;
  }
});

// ===== IRC / WebSocket =====
function startChat() {
  setupScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  chatMessages.innerHTML = '';
  messageCount = 0;
  updateMsgCount();
  channelName.textContent = channel;
  setStatus('connecting');
  addSystemMessage(`#${channel} に接続中...`);

  ws = new WebSocket(TWITCH_WS_URL);

  ws.onopen = () => {
    ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
    ws.send('PASS oauth:will_not_actually_work');  // 匿名接続
    ws.send('NICK justinfan' + Math.floor(Math.random() * 99999));
    ws.send(`JOIN #${channel}`);
  };

  ws.onmessage = (event) => {
    const lines = event.data.split('\r\n').filter(Boolean);
    lines.forEach(handleIRCLine);
  };

  ws.onerror = () => {
    setStatus('error');
    addSystemMessage('接続エラーが発生しました。チャンネル名を確認してください。');
  };

  ws.onclose = () => {
    if (chatScreen.classList.contains('hidden')) return;
    setStatus('error');
    addSystemMessage('接続が切断されました。');
  };
}

function disconnect() {
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
}

function showSetup() {
  setupScreen.classList.remove('hidden');
  chatScreen.classList.add('hidden');
}

function handleIRCLine(line) {
  // PING への応答
  if (line.startsWith('PING')) {
    ws.send('PONG :tmi.twitch.tv');
    return;
  }

  // JOIN 成功
  if (line.includes(`JOIN #${channel}`)) {
    setStatus('connected');
    addSystemMessage(`#${channel} に接続しました！`);
    return;
  }

  // PRIVMSG（チャットメッセージ）
  if (!line.includes('PRIVMSG')) return;

  const parsed = parseIRCMessage(line);
  if (!parsed) return;

  addChatMessage(parsed.username, parsed.text, parsed.color);
}

function parseIRCMessage(line) {
  try {
    // IRCタグ付きフォーマット: @tags :nick!nick@nick.tmi.twitch.tv PRIVMSG #channel :message
    const tagMatch = line.match(/^@([^ ]+) :(\w+)!\w+@\S+ PRIVMSG #\w+ :(.+)$/);
    if (tagMatch) {
      const tags = parseTags(tagMatch[1]);
      return {
        username: tags['display-name'] || tagMatch[2],
        text: tagMatch[3],
        color: tags['color'] || null,
      };
    }
    // タグなしフォーマット
    const noTagMatch = line.match(/:(\w+)!\w+@\S+ PRIVMSG #\w+ :(.+)$/);
    if (noTagMatch) {
      return { username: noTagMatch[1], text: noTagMatch[2], color: null };
    }
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

// ===== メッセージ表示 =====
function addChatMessage(username, text, color) {
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
    <div class="msg-original${showOrigCb.checked ? '' : ' hidden-orig'}">${escapeHtml(text)}</div>
    <div class="msg-translated translating">翻訳中...</div>
  `;

  chatMessages.appendChild(el);
  trimMessages();
  messageCount++;
  updateMsgCount();
  if (autoScroll) scrollToBottom();

  const translatedEl = el.querySelector('.msg-translated');

  if (shouldSkipTranslation(text)) {
    translatedEl.textContent = text;
    translatedEl.classList.remove('translating');
    return;
  }

  // 翻訳キューに追加（並列リクエストを防ぐ）
  translateQueue = translateQueue.then(() =>
    sleep(TRANSLATE_DELAY_MS)
      .then(() => translateText(text, sourceLang, targetLang))
      .then(translated => {
        translatedEl.textContent = translated;
        translatedEl.classList.remove('translating');
        translatedEl.classList.add('ja');
        if (autoScroll) scrollToBottom();
      })
      .catch(() => {
        translatedEl.textContent = text + '（翻訳失敗）';
        translatedEl.classList.remove('translating');
      })
  ).catch(() => {});
}

function addSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'chat-msg system';
  el.innerHTML = `<div class="msg-translated">${escapeHtml(text)}</div>`;
  chatMessages.appendChild(el);
  if (autoScroll) scrollToBottom();
}

function shouldSkipTranslation(text) {
  return TRANSLATE_SKIP_PATTERNS.some(p => p.test(text));
}

function trimMessages() {
  while (chatMessages.children.length > MAX_MESSAGES) {
    chatMessages.removeChild(chatMessages.firstChild);
  }
}

function updateMsgCount() {
  msgCountEl.textContent = `${messageCount} メッセージ`;
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ===== 翻訳 (Google翻訳 非公式API) =====
async function translateText(text, from, to) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('translate failed');
    const data = await res.json();
    // レスポンス形式: [[["翻訳文", "原文", null, null, 1], ...], ...]
    const translated = (data[0] ?? []).map(item => item?.[0]).filter(Boolean).join('') || text;
    return translated;
  } finally {
    clearTimeout(timer);
  }
}

// ===== ユーティリティ =====
function setStatus(state) {
  statusDot.className = `status-dot ${state}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
