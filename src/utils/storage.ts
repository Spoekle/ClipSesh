export const AUTH_TOKEN_EVENT = 'clipsesh_auth_token_changed';

export const dispatchAuthTokenChanged = (token: string | null): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_TOKEN_EVENT, { detail: token }));
  }
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      if (key === 'token') {
        const urlToken = new URLSearchParams(window.location.search).get('token');
        if (urlToken) {
          localStorage.setItem('token', urlToken);
          return urlToken;
        }
      }
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
      if (key === 'token') {
        dispatchAuthTokenChanged(value);
      }
    } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
      if (key === 'token') {
        dispatchAuthTokenChanged(null);
      }
    } catch {}
  },
};

export const getAuthToken = (): string | null => safeLocalStorage.getItem('token');
export const hasAuthToken = (): boolean => Boolean(getAuthToken());
export const setAuthToken = (token: string): void => safeLocalStorage.setItem('token', token);
export const removeAuthToken = (): void => safeLocalStorage.removeItem('token');

export default safeLocalStorage;
