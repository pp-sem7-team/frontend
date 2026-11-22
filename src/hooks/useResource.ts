import { useEffect, useState } from 'react';
import { errorMessage } from '../api/client';

// Callers memoize load; aborting prevents stale route responses from replacing data.
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setState({ data: null, loading: true, error: null });
      return load(controller.signal).then(data => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null });
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ data: null, loading: false, error: errorMessage(error) });
      });
    });
    return () => controller.abort();
  }, [load, version]);
  return { ...state, reload: () => setVersion(value => value + 1) };
}
