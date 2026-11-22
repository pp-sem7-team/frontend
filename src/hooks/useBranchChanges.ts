import { useCallback, useRef, useState } from 'react';
import { resources } from '../api/resources';
import { analysisReadiness, loadChangePages, sameResult } from '../api/generation';
import { useResource } from './useResource';
import { useMutation } from './useGeneration';
import type { Change, Commit } from '../types/api';

export const historyPageSize = 10;

export function useBranchChanges(branchId: string) {
  const [offset, setOffset] = useState(0);
  const load = useCallback((signal: AbortSignal) =>
    loadChangePages((page, requestSignal) => resources.changes(branchId, page, requestSignal), signal),
  [branchId]);
  const history = useResource(load);
  const [updates, setUpdates] = useState<Record<string, Change>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const previousCommits = useRef(new Map<string, Commit | null>());
  const submission = useMutation('Ветка закрыта. Добавить изменение нельзя.');

  const changes = history.data?.map(change => updates[change.id] ?? change) ?? [];
  const selected = selectedId ? updates[selectedId] ?? changes.find(change => change.id === selectedId) : null;
  const candidates = selected && !changes.some(change => change.id === selected.id)
    ? [...changes, selected]
    : changes;
  const detailLoading = Boolean(selectedId && selectedId !== detailId);
  const watched = candidates.filter(change =>
    (change.id === selectedId && detailLoading) ||
    change.analysis.status === 'pending' || change.commit?.status === 'pending');

  function select(changeId: string) {
    if (changeId === selectedId) return;
    const change = changes.find(item => item.id === changeId);
    if (change) save(change);
    setDetailId(null);
    setSelectedId(changeId);
  }

  function save(change: Change) {
    setUpdates(previous => ({ ...previous, [change.id]: change }));
  }

  function saveCommit(change: Change, commit: Commit) {
    if (commit.status === 'pending') previousCommits.current.set(change.id, change.commit);
    save({ ...change, commit });
  }

  function receiveDetail(change: Change) {
    // Keep the 202 state while a GET still returns the pre-generation snapshot.
    const previous = previousCommits.current.get(change.id);
    const current = updates[change.id]?.commit;
    if (previousCommits.current.has(change.id) && current?.status === 'pending' &&
        (!change.commit || (previous && sameResult(previous, change.commit)))) {
      change = { ...change, commit: current };
    } else if (change.commit?.status !== 'pending') {
      previousCommits.current.delete(change.id);
    }
    save(change);
    if (change.id === selectedId) setDetailId(change.id);
    return change;
  }

  async function submit(rawDiff: string) {
    if (!rawDiff.trim()) return false;
    return submission.run(signal => resources.submitDiff(branchId, rawDiff, signal), change => {
      save(change);
      setDetailId(null);
      setSelectedId(change.id);
      setOffset(0);
      history.reload();
    });
  }

  const readiness = submission.busy || history.loading
    ? 'Проверяем изменения ветки…'
    : history.error ? 'Загрузите историю, чтобы проверить анализ изменений.'
      : analysisReadiness(changes);

  return {
    history, changes, watched, selected, selectedId, select, detailLoading, receiveDetail, saveCommit,
    offset, setOffset, readiness, submit, submitting: submission.busy, submitError: submission.error,
  };
}
