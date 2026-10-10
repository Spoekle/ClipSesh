'use client';

import { useSyncExternalStore } from 'react';
import { safeLocalStorage, AUTH_TOKEN_EVENT, getAuthToken } from '@/utils/storage';

function subscribeAuthToken(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_TOKEN_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(AUTH_TOKEN_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useAuthToken(): string | null {
  return useSyncExternalStore(
    subscribeAuthToken,
    getAuthToken,
    () => null
  );
}

export default useAuthToken;
