export const TWITCH_WS_URL = 'wss://irc-ws.chat.twitch.tv:443';
export const TWITCH_CLIENT_ID = '1vbld5ti60dwqzmxrpfkcnk1oph5jd';
export const TWITCH_REDIRECT_URI = 'https://kawachan-jp.github.io/twitch-chat-translate/';
export const MAX_MESSAGES = 200;
export const TRANSLATE_DELAY_MS = 100;
export const TRANSLATE_CACHE_MAX = 500; // 翻訳キャッシュの最大保持件数
export const TRANSLATE_SKIP_PATTERNS = [
  /^[!\/]/,             // コマンド (!ban, /me など)
  /^[^\p{L}\p{N}]+$/u, // 文字・数字を含まない（記号・絵文字のみ）
];
