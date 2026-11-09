import type { TokenPair } from '../types/api.ts';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const messages: Record<number, string> = {
  400: 'Проверьте введённые данные или формат Git diff.',
  401: 'Сессия истекла или неверны email и пароль. Войдите снова.',
  404: 'Ресурс не найден или недоступен.',
  409: 'Конфликт: имя уже занято или ветка закрыта.',
  413: 'Git diff превышает допустимый размер.',
  503: 'Сервис временно недоступен. Попробуйте позже.',
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Не удалось связаться с сервером. Проверьте подключение и повторите запрос.';
}

export function assertTokenPair(value: unknown): asserts value is TokenPair {
  if (!value || typeof value !== 'object' ||
      !('access_token' in value) || typeof value.access_token !== 'string' || !value.access_token ||
      !('refresh_token' in value) || typeof value.refresh_token !== 'string' || !value.refresh_token) {
    throw new ApiError(200, 'invalid_tokens', 'Сервер не вернул корректную пару токенов.');
  }
}

interface SessionAccess {
  get: () => TokenPair | null;
  set: (tokens: TokenPair | null) => void;
}
interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  public?: boolean;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly session: SessionAccess;
  private readonly transport: typeof fetch;
  private refreshing: Promise<void> | null = null;
  private rotatedFrom: TokenPair | null = null;
  private rotatedTo: TokenPair | null = null;

  constructor(baseUrl: string, session: SessionAccess, transport: typeof fetch = fetch) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.session = session;
    this.transport = transport;
  }

  private async send<T>(path: string, options: RequestOptions, token?: string): Promise<T> {
    const transport = this.transport;
    const response = await transport(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      credentials: 'omit',
    });
    const text = response.status === 204 ? '' : await response.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : undefined; } catch {
      if (response.ok) throw new ApiError(response.status, 'invalid_response', 'Сервер вернул некорректный JSON.');
    }
    if (!response.ok) {
      const detail = data && typeof data === 'object' && 'error' in data ? data.error : null;
      const code = detail && typeof detail === 'object' && 'code' in detail && typeof detail.code === 'string' ? detail.code : 'http_error';
      const message = detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string' ? detail.message : messages[response.status] ?? 'Ошибка сервера. Попробуйте позже.';
      throw new ApiError(response.status, code, message);
    }
    return data as T;
  }

  async refresh(): Promise<void> {
    if (this.refreshing) return this.refreshing;
    const previous = this.session.get();
    if (!previous) throw new ApiError(401, 'no_session', messages[401]);
    this.refreshing = (async () => {
      try {
        const next = await this.send<TokenPair>('/auth/refresh', { method: 'POST', body: { refresh_token: previous.refresh_token } });
        assertTokenPair(next);
        // Logout or a new login must never be undone by an old refresh response.
        if (this.session.get() === previous) {
          this.rotatedFrom = previous;
          this.rotatedTo = next;
          this.session.set(next);
        }
      } catch (error) {
        if (this.session.get() === previous) this.session.set(null);
        throw error;
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (options.public) return this.send<T>(path, options);
    if (this.refreshing) await this.refreshing;
    const initial = this.session.get();
    if (!initial) throw new ApiError(401, 'no_session', messages[401]);
    try {
      return await this.send<T>(path, options, initial.access_token);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      options.signal?.throwIfAborted();
      if (this.session.get() === initial) await this.refresh();
      // Retry only within the same session, never under a different account.
      const next = this.session.get();
      if (initial !== this.rotatedFrom || next !== this.rotatedTo) throw error;
      if (!next) throw error;
      options.signal?.throwIfAborted();
      try { return await this.send<T>(path, options, next.access_token); } catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401 && this.session.get() === next) this.session.set(null);
        throw retryError;
      }
    }
  }

  async logout(): Promise<void> {
    // Wait for rotation so the token we revoke is the current refresh token.
    try { await this.refreshing; } catch { /* Session already cleared. */ }
    const tokens = this.session.get();
    this.session.set(null);
    if (tokens) await this.send<void>('/auth/logout', { method: 'POST', body: { refresh_token: tokens.refresh_token } });
  }
}
