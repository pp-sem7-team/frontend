import { useState } from 'react';
import { FileCode2, LoaderCircle } from 'lucide-react';

interface DiffInputProps {
  onAnalyze?: (rawDiff: string) => void | Promise<void>;
  isAnalyzing?: boolean;
  disabled?: boolean;
}

export function DiffInput({
  onAnalyze,
  isAnalyzing = false,
  disabled = false,
}: DiffInputProps) {
  const [rawDiff, setRawDiff] = useState('');

  const canAnalyze =
    rawDiff.trim().length > 0 &&
    !isAnalyzing &&
    !disabled &&
    Boolean(onAnalyze);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAnalyze || !onAnalyze) {
      return;
    }

    void onAnalyze(rawDiff);
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <FileCode2 size={18} />
        </div>

        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Анализ изменений
          </h3>

          <p className="mt-1 text-xs text-text-muted">
            Вставьте Git diff для анализа изменений.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="raw-diff"
          className="mb-2 block text-sm font-medium text-text-secondary"
        >
          Git diff
        </label>

        <textarea
          id="raw-diff"
          name="raw_diff"
          value={rawDiff}
          onChange={(event) => setRawDiff(event.target.value)}
          disabled={disabled || isAnalyzing}
          placeholder="Вставьте сюда содержимое git diff..."
          spellCheck={false}
          className={[
            'min-h-[260px] w-full resize-y rounded-lg',
            'border border-border bg-background p-4',
            'font-mono text-[13px] leading-6 text-text-primary',
            'placeholder:text-text-muted',
            'outline-none transition-colors',
            'focus:border-accent',
            'disabled:cursor-not-allowed disabled:opacity-60',
          ].join(' ')}
        />

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-xs text-text-muted">
            Символов: {rawDiff.length}
          </span>

          <button
            type="submit"
            disabled={!canAnalyze}
            className={[
              'inline-flex h-10 items-center justify-center gap-2',
              'rounded-lg bg-accent px-5 text-sm font-medium text-white',
              'transition-colors hover:bg-accent-hover',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ].join(' ')}
          >
            {isAnalyzing && (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            )}

            {isAnalyzing
              ? 'Анализируем...'
              : 'Анализировать изменения'}
          </button>
        </div>
      </form>
    </section>
  );
}