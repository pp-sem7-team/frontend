import { ApiError, errorMessage } from './client.ts';
import type { Change, Commit, PaginatedResponse, PullRequest } from '../types/api.ts';

export function generationError(error: unknown, conflict: string) {
  if (error instanceof ApiError && error.code === 'http_error') {
    if (error.status === 409) return conflict;
    if (error.status === 400) return 'Сервер отклонил запрос. Проверьте введённые данные.';
  }
  return errorMessage(error);
}

export function sameResult(previous: Commit | PullRequest, current: Commit | PullRequest) {
  if (previous.id !== current.id || previous.updated_at !== current.updated_at ||
      previous.status !== current.status || previous.is_edited_by_user !== current.is_edited_by_user) return false;
  if ('message' in previous && 'message' in current) {
    return previous.type === current.type && previous.scope === current.scope && previous.message === current.message;
  }
  return 'title' in previous && 'title' in current &&
    previous.title === current.title && previous.description === current.description;
}

export async function loadChangePages(
  load: (offset: number, signal: AbortSignal) => Promise<PaginatedResponse<Change>>,
  signal: AbortSignal,
) {
  const changes = new Map<string, Change>();
  let offset = 0;
  while (true) {
    signal.throwIfAborted();
    const { items, total, offset: receivedOffset } = await load(offset, signal);
    signal.throwIfAborted();
    for (const change of items) changes.set(change.id, change);
    const next = receivedOffset + items.length;
    if (next >= total && changes.size === total) break;
    if (receivedOffset !== offset || next <= offset || next > total || (next === total && changes.size !== total)) {
      throw new ApiError(409, 'history_changed', 'История изменилась во время загрузки. Повторите проверку.');
    }
    offset = next;
  }
  return [...changes.values()].sort((a, b) => b.sequence_number - a.sequence_number);
}

export function analysisReadiness(changes: Change[]) {
  if (!changes.length) return 'В ветке пока нет изменений.';
  if (changes.some(change => change.analysis.status === 'failed')) return 'Анализ одного или нескольких изменений завершился ошибкой.';
  if (changes.some(change => change.analysis.status !== 'done')) return 'Дождитесь завершения анализа всех изменений ветки.';
  return null;
}
