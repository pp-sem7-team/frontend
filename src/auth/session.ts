import { ApiClient, assertTokenPair } from '../api/client';
import type { Credentials, TokenPair, User } from '../types/api';

const key = 'gitmind.session';
function restore(): TokenPair | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (value && typeof value === 'object' && 'access_token' in value && 'refresh_token' in value && typeof value.access_token === 'string' && typeof value.refresh_token === 'string') return value as TokenPair;
  } catch { /* Storage may be unavailable; use an in-memory session. */ }
  return null;
}
let tokens = restore();
let snapshot: { user: User | null; checking: boolean; error: string | null } = { user: null, checking: Boolean(tokens), error: null };
const listeners = new Set<() => void>();
function publish(next: typeof snapshot) {
  snapshot = next;
  listeners.forEach(listener => listener());
}
function setTokens(next: TokenPair | null) {
  tokens = next;
  try {
    if (next) sessionStorage.setItem(key, JSON.stringify(next));
    else sessionStorage.removeItem(key);
  } catch { /* Continue in memory if storage is blocked. */ }
  if (!next) publish({ user: null, checking: false, error: null });
}
export const api = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? '', { get: () => tokens, set: setTokens });
let initialization: Promise<void> | null = null;
export const session = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => snapshot,
  initialize() {
    if (!initialization) initialization = (async () => {
      if (!tokens) return;
      try {
        const user = await api.request<User>('/users/me');
        if (tokens) publish({ user, checking: false, error: null });
      } catch {
        setTokens(null);
        publish({ user: null, checking: false, error: 'Не удалось восстановить сессию. Войдите снова.' });
      }
    })();
    return initialization;
  },
  async authenticate(mode: 'login' | 'register', credentials: Credentials) {
    const pair = await api.request<TokenPair>(`/auth/${mode}`, { method: 'POST', body: credentials, public: true });
    assertTokenPair(pair);
    setTokens(pair);
    try {
      const user = await api.request<User>('/users/me');
      publish({ user, checking: false, error: null });
    } catch (error) { setTokens(null); throw error; }
  },
  async logout() {
    try { await api.logout(); } catch {
      if (!tokens) publish({ user: null, checking: false, error: 'Локальный выход выполнен, но сервер не подтвердил отзыв токена.' });
    }
  },
};
