import {
  Clock3,
  GitCommitHorizontal,
  History,
  LoaderCircle,
} from 'lucide-react';

import type { Change } from '../../types/api';

interface ChangeHistoryProps {
  changes?: Change[];
  isLoading?: boolean;
  error?: string | null;
  selectedChangeId?: string | null;
  onSelectChange?: (changeId: string) => void;
}

export function ChangeHistory({
  changes = [],
  isLoading = false,
  error = null,
  selectedChangeId,
  onSelectChange,
}: ChangeHistoryProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <History size={19} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            История изменений
          </h3>

          <p className="mt-1 text-xs text-text-muted">
            Изменения текущей ветки
          </p>
        </div>
      </div>

      {isLoading && (
        <div
          role="status"
          className="flex items-center gap-3 py-6 text-sm text-text-secondary"
        >
          <LoaderCircle
            size={17}
            className="animate-spin text-accent"
          />

          Загрузка истории...
        </div>
      )}

      {!isLoading && error && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft p-4"
        >
          <p className="text-sm text-danger">
            {error}
          </p>
        </div>
      )}

      {!isLoading && !error && changes.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
          <Clock3
            size={23}
            className="mx-auto mb-3 text-text-muted"
          />

          <p className="text-sm text-text-secondary">
            История пока пуста
          </p>

          <p className="mt-2 text-xs leading-5 text-text-muted">
            Здесь появятся изменения после их добавления в ветку.
          </p>
        </div>
      )}

      {!isLoading && !error && changes.length > 0 && (
        <div className="space-y-2">
          {[...changes]
            .sort(
              (a, b) =>
                b.sequence_number - a.sequence_number,
            )
            .map((change) => {
              const isSelected =
                selectedChangeId === change.id;

              const isClickable = Boolean(onSelectChange);

              const content = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <GitCommitHorizontal
                        size={15}
                        className="shrink-0 text-accent"
                      />

                      <span className="text-xs font-medium text-text-primary">
                        Изменение №{change.sequence_number}
                      </span>
                    </div>

                    <span className="shrink-0 text-[10px] text-text-muted">
                      {new Intl.DateTimeFormat('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).format(new Date(change.created_at))}
                    </span>
                  </div>

                  <p className="mt-2 truncate text-xs text-text-secondary">
                    {change.commit?.status === 'done' &&
                    change.commit.message
                      ? change.commit.message
                      : 'Сообщение коммита недоступно'}
                  </p>

                  <p className="mt-2 text-[11px] text-text-muted">
                    Анализ: {
                      change.analysis.status === 'done'
                        ? 'готов'
                        : change.analysis.status === 'pending'
                          ? 'выполняется'
                          : 'ошибка'
                    }
                  </p>
                </>
              );

              const className = [
                'w-full rounded-lg border p-3 text-left',
                'transition-colors',
                isSelected
                  ? 'border-accent bg-accent-soft'
                  : 'border-border bg-background',
                isClickable
                  ? 'cursor-pointer hover:border-border-strong'
                  : '',
              ].join(' ');

              return isClickable ? (
                <button
                  key={change.id}
                  type="button"
                  onClick={() => onSelectChange?.(change.id)}
                  aria-pressed={isSelected}
                  className={className}
                >
                  {content}
                </button>
              ) : (
                <div key={change.id} className={className}>
                  {content}
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}