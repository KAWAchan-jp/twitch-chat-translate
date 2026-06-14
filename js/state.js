export const state = {
  ws: null,
  channel: '',
  sourceLang: 'en',
  targetLang: 'ja',
  messageCount: 0,
  unreadWhilePaused: 0,
  translateQueue: Promise.resolve(),
  autoScroll: true,
  hideBots: true,
  twitchUsername: '',
  twitchToken: '',
  isAuthenticated: false,
};
