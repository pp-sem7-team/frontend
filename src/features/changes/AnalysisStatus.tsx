import type { Change } from '../../types/api';

const statusText = {
  pending: 'Изменение принято. Анализ выполняется...',
  done: 'Анализ завершён.',
  failed: 'Анализ завершился ошибкой.',
};

export function AnalysisStatus({ change }: { change: Change }) {
  return (
    <section aria-live="polite" className="mt-4 rounded-xl border border-border bg-surface p-5 text-sm">
      <p>{statusText[change.analysis.status]}</p>
      {change.analysis.status === 'done' && change.analysis.structured_changes !== null && (
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs text-text-secondary">
          {JSON.stringify(change.analysis.structured_changes, null, 2)}
        </pre>
      )}
    </section>
  );
}
