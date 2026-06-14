import { BOT_USERNAMES } from './config.js?v=0.9.2';

const STORAGE_KEY = 'blocked_users';

// ユーザーが手動登録した除外ユーザー（bot・リスナー問わず）。小文字で保持
let customBlocked = loadBlocked();

function loadBlocked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...customBlocked]));
}

// 登録済みの除外ユーザー一覧（ソート済み）
export function getBlockedUsers() {
  return [...customBlocked].sort();
}

// 除外ユーザーを追加（@や#、前後空白を除去し小文字化）。追加した名前を返す
export function addBlockedUser(name) {
  const n = name.trim().toLowerCase().replace(/^[@#]/, '');
  if (n) { customBlocked.add(n); save(); }
  return n;
}

export function removeBlockedUser(name) {
  customBlocked.delete(name.toLowerCase());
  save();
}

// botのメッセージ、手動登録した除外ユーザー、または ! で始まるコマンドかどうかを判定
export function isBotOrCommand(username, text) {
  const u = username.toLowerCase();
  if (BOT_USERNAMES.has(u)) return true;
  if (customBlocked.has(u)) return true;
  if (/^!/.test(text.trim())) return true;
  return false;
}
