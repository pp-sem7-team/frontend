import { useState } from 'react';
import { ApiError } from '../api/client';
import { resources } from '../api/resources';
import { analysisReadiness, loadChangePages, sameResult } from '../api/generation';
import { useMutation, usePolling } from './useGeneration';
import type { PullRequest, PullRequestEdit } from '../types/api';

export function useBranchPullRequest(branchId: string, readiness: string | null) {
  const [result, setResult] = useState<PullRequest | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [previous, setPrevious] = useState<PullRequest | null>(null);
  const mutation = useMutation('Для генерации нужны изменения с завершённым анализом. Описание также может уже генерироваться на сервере. Для сохранения дождитесь готового результата.');
  const pending = result?.status === 'pending';

  const polling = usePolling(
    !loaded || pending,
    async signal => {
      const response = await resources.pullRequest(branchId, signal);
      if (!response && pending) throw new ApiError(404, 'missing_pr', 'Описание PR пока недоступно. Повторите проверку статуса.');
      return response;
    },
    response => {
      if (previous && response && sameResult(previous, response)) return true;
      if (response?.status !== 'pending') setPrevious(null);
      setResult(response);
      setLoaded(true);
      return response?.status === 'pending';
    },
  );

  async function generate() {
    if (!loaded || readiness || pending || mutation.busy) return;
    if (result?.is_edited_by_user && !window.confirm('Повторная генерация перезапишет ручные изменения описания PR. Продолжить?')) return;
    await mutation.run(async signal => {
      const changes = await loadChangePages((offset, requestSignal) => resources.changes(branchId, offset, requestSignal), signal);
      const blocked = analysisReadiness(changes);
      if (blocked) throw new ApiError(409, 'analysis_incomplete', blocked);
      return resources.generatePullRequest(branchId, signal);
    }, response => {
      setPrevious(result);
      setResult(response);
    });
  }

  function save(edit: PullRequestEdit) {
    if (result?.status !== 'done') return Promise.resolve(false);
    return mutation.run(signal => resources.editPullRequest(branchId, edit, signal), setResult);
  }

  return { result, loaded, pending, generate, save, polling, mutation };
}
