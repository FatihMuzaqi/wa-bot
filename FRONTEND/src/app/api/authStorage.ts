const ACCESS_TOKEN_KEY = 'wa_bot_access_token';
const REFRESH_TOKEN_KEY = 'wa_bot_refresh_token';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (tokens: { accessToken?: string; refreshToken?: string }) => {
  if (tokens.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isAuthenticated = () => Boolean(getAccessToken());
