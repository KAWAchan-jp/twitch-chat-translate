export const state = {
  ws: null,
  channel: '',
  sourceLang: 'en',
  targetLang: 'ja',
  messageCount: 0,
  translateQueue: Promise.resolve(),
  autoScroll: true,
  twitchUsername: '',
  twitchToken: '',
  isAuthenticated: false,
};
