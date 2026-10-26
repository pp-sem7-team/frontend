import { Check, ClipboardCopy, GitCommitHorizontal, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import type { Commit } from '../../types/api';

interface CommitResultProps {
  commit?: Commit | null;
}

export function CommitResult({ commit }: CommitResultProps) {
  const [copied, setCopied] = useState(false);

  const isReady =
    commit?.status === 'done' &&
    commit.type !== null &&
    commit.message !== null;

  const commitText = isReady
    ? `${commit.type}${commit.scope ? `(${commit.scope})` : ''}: ${commit.message}`
    : null;

  async function handleCopy() {
    if (!commitText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(commitText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <GitCommitHorizontal size={19} />
        </div>

        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Сообщение коммита
          </h3>

          <p className="mt-1 text-xs text-text-muted">
            Результат генерации Conventional Commit.
          </p>
        </div>
      </div>

      {!commit && (
        <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center">
          <p className="text-sm text-text-secondary">
            Сообщение коммита пока не создано.
          </p>

          <p className="mt-2 text-xs text-text-muted">
            Добавьте Git diff и запустите анализ, чтобы получить результат.
          </p>
        </div>
      )}

      {commit?.status === 'pending' && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-border bg-background p-5"
        >
          <LoaderCircle size={18} className="animate-spin text-accent" />

          <span className="text-sm text-text-secondary">
            Генерация сообщения коммита...
          </span>
        </div>
      )}

      {commit?.status === 'failed' && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft p-5"
        >
          <p className="text-sm text-danger">
            Не удалось сгенерировать сообщение коммита.
          </p>
        </div>
      )}

      {commit?.status === 'done' && !isReady && (
        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-sm text-text-secondary">
            Результат генерации пока недоступен.
          </p>
        </div>
      )}

      {commitText && (
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <code className="break-all font-mono text-sm leading-6 text-text-primary">
              {commitText}
            </code>

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Скопировать сообщение коммита"
              className="shrink-0 rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              {copied ? <Check size={17} /> : <ClipboardCopy size={17} />}
            </button>
          </div>

          {commit?.is_edited_by_user && (
            <p className="mt-3 text-xs text-text-muted">
              Сообщение отредактировано пользователем.
            </p>
          )}
        </div>
      )}
    </section>
  );
}