import type { Change } from '../../types/api';

const statusText = {
  pending: 'Изменение принято. Анализ выполняется...',
  done: 'Анализ завершён.',
  failed: 'Анализ завершился ошибкой.',
};

function formatResult(value: unknown) {
  if (value == null || value === '' ||
      (typeof value === 'object' && Object.keys(value).length === 0)) return null;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

export function AnalysisStatus({ change }: { change: Change }) {
  const { status, structured_changes: structuredChanges } = change.analysis;
  const result = status === 'done' ? formatResult(structuredChanges) : null;
  return (
    <section className="mt-4 min-w-0 rounded-xl border border-border bg-surface p-5 text-sm">
      <h3 className="mb-2 font-semibold">Изменение №{change.sequence_number}</h3>
      <p role={status === 'failed' ? 'alert' : 'status'}>{statusText[status] ?? 'Статус анализа неизвестен.'}</p>
      {status === 'done' && (result ? (
        <pre tabIndex={0} aria-label="Результат анализа" className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap wrap-anywhere text-xs text-text-secondary">
          {result}
        </pre>
      ) : <p className="mt-3 text-text-muted">Нет данных анализа для отображения.</p>)}
    </section>
  );
}
