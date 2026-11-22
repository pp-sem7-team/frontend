import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { generationError } from '../api/generation';

export function usePolling<T>(
  enabled: boolean,
  read: (signal: AbortSignal) => Promise<T>,
  accept: (value: T) => boolean,
) {
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const readLatest = useEffectEvent(read);
  const acceptLatest = useEffectEvent(accept);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (controller.signal.aborted) return;
      try {
        const value = await readLatest(controller.signal);
        if (!controller.signal.aborted && acceptLatest(value)) {
          timer = setTimeout(() => void poll(), 2500);
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      }
    }

    queueMicrotask(() => void poll());
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [enabled, version]);

  return {
    error,
    retry: () => {
      setError(null);
      setVersion(value => value + 1);
    },
  };
}

export function useMutation(conflict: string) {
  const active = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => {
    active.current?.abort();
    active.current = null;
  }, []);

  async function run<T>(request: (signal: AbortSignal) => Promise<T>, save: (value: T) => void) {
    if (active.current) return false;
    const controller = new AbortController();
    active.current = controller;
    setError(null);
    setBusy(true);
    try {
      const value = await request(controller.signal);
      if (controller.signal.aborted) return false;
      save(value);
      return true;
    } catch (failure) {
      if (!controller.signal.aborted) setError(generationError(failure, conflict));
      return false;
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }

  return { busy, error, run };
}
