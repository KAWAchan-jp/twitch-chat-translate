import { BOT_USERNAMES } from './config.js?v=0.8.16';

// botのメッセージ、または ! で始まるコマンドかどうかを判定
export function isBotOrCommand(username, text) {
  if (BOT_USERNAMES.has(username.toLowerCase())) return true;
  if (/^!/.test(text.trim())) return true;
  return false;
}
