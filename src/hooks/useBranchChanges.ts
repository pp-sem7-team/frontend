import { useCallback, useEffect, useRef, useState } from 'react';
import { resources } from '../api/resources';
import { errorMessage } from '../api/client';
import { useResource } from './useResource';
import type { Change } from '../types/api';

export function useBranchChanges(branchId: string) {
  const [offset, setOffset] = useState(0);
  const load = useCallback((signal: AbortSignal) => resources.changes(branchId, offset, signal), [branchId, offset]);
  const history = useResource(load);
  const [updates, setUpdates] = useState<Record<string, Change>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pollVersion, setPollVersion] = useState(0);
  const submittingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const changes = history.data?.items.map(change => updates[change.id] ?? change) ?? [];
  const selected = selectedId ? updates[selectedId] ?? changes.find(change => change.id === selectedId) : null;
  const pending = [...new Set([...changes, ...(selected ? [selected] : [])]
    .filter(change => change.analysis.status === 'pending').map(change => change.id))].join(',');

  useEffect(() => {
    if (!pending || pollError) return;
    const controller = new AbortController();
    let active = false;
    const poll = async () => {
      if (active) return;
      active = true;
      try {
        const results = await Promise.all(pending.split(',').map(changeId => resources.change(changeId, controller.signal)));
        if (!controller.signal.aborted) setUpdates(previous => ({ ...previous, ...Object.fromEntries(results.map(change => [change.id, change])) }));
      } catch (error) {
        if (!controller.signal.aborted) setPollError(errorMessage(error));
      } finally { active = false; }
    };
    // This timer only polls real HTTP resources; it never simulates completion.
    const interval = window.setInterval(() => { void poll(); }, 2500);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [pending, pollError, pollVersion]);

  async function submit(rawDiff: string) {
    if (submittingRef.current || !rawDiff.trim()) return;
    submittingRef.current = true; setSubmitting(true); setSubmitError(null);
    try {
      const change = await resources.submitDiff(branchId, rawDiff);
      if (!mounted.current) return;
      setUpdates(previous => ({ ...previous, [change.id]: change }));
      setSelectedId(change.id); setPollError(null);
      history.reload();
    } catch (error) { if (mounted.current) setSubmitError(errorMessage(error)); }
    finally { submittingRef.current = false; if (mounted.current) setSubmitting(false); }
  }
  return {
    history, changes, selected, selectedId, setSelectedId, offset, setOffset,
    submitting, submitError, submit, pollError,
    retryPolling: () => { setPollError(null); setPollVersion(value => value + 1); },
  };
}
