export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

export const getAuthToken = (): string | null => safeLocalStorage.getItem('token');
export const hasAuthToken = (): boolean => Boolean(getAuthToken());
export const setAuthToken = (token: string): void => safeLocalStorage.setItem('token', token);
export const removeAuthToken = (): void => safeLocalStorage.removeItem('token');

export default safeLocalStorage;
