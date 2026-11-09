import { useState } from 'react';

import {
  Check,
  ClipboardCopy,
  GitPullRequest,
  LoaderCircle,
  Sparkles,
} from 'lucide-react';

import type { PullRequest } from '../../types/api';

interface PullRequestResultProps {
  pullRequest?: PullRequest | null;
  onGenerate?: () => void | Promise<void>;
  isGenerating?: boolean;
  canGenerate?: boolean;
}

export function PullRequestResult({
  pullRequest,
  onGenerate,
  isGenerating = false,
  canGenerate = false,
}: PullRequestResultProps) {
  const [copied, setCopied] = useState(false);

  const isReady =
    pullRequest?.status === 'done' &&
    pullRequest.title !== null &&
    pullRequest.description !== null;

  const prText = isReady
    ? `${pullRequest.title}\n\n${pullRequest.description}`
    : null;

  const canStartGeneration =
    Boolean(onGenerate) &&
    canGenerate &&
    !isGenerating &&
    pullRequest?.status !== 'pending';

  async function handleCopy() {
    if (!prText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(prText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <GitPullRequest size={19} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Pull Request
          </h3>

          <p className="mt-1 text-xs text-text-muted">
            Описание изменений ветки
          </p>
        </div>
      </div>

      {!pullRequest && (
        <div className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center">
          <GitPullRequest
            size={23}
            className="mx-auto mb-3 text-text-muted"
          />

          <p className="text-sm text-text-secondary">
            Описание PR пока не создано
          </p>

          <p className="mt-2 text-xs leading-5 text-text-muted">
            Добавьте изменения в ветку и завершите их анализ,
            чтобы подготовить описание Pull Request.
          </p>
        </div>
      )}

      {(isGenerating || pullRequest?.status === 'pending') && (
        <div
          role="status"
          className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-background p-4"
        >
          <LoaderCircle
            size={17}
            className="animate-spin text-accent"
          />

          <span className="text-sm text-text-secondary">
            Генерация описания PR...
          </span>
        </div>
      )}

      {!isGenerating && pullRequest?.status === 'failed' && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-danger/30 bg-danger-soft p-4"
        >
          <p className="text-sm text-danger">
            Не удалось сгенерировать описание PR.
          </p>
        </div>
      )}

      {pullRequest?.status === 'done' && !isReady && (
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <p className="text-sm text-text-secondary">
            Результат генерации недоступен.
          </p>
        </div>
      )}

      {prText && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="break-words text-sm font-semibold text-text-primary">
                {pullRequest?.title}
              </h4>

              <button
                type="button"
                onClick={handleCopy}
                aria-label="Скопировать описание Pull Request"
                className="shrink-0 rounded-md p-1.5 text-text-secondary hover:bg-surface-hover"
              >
                {copied ? (
                  <Check size={16} />
                ) : (
                  <ClipboardCopy size={16} />
                )}
              </button>
            </div>

            <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-text-secondary">
              {pullRequest?.description}
            </p>
          </div>

          {pullRequest?.is_edited_by_user && (
            <p className="text-xs text-text-muted">
              Описание отредактировано пользователем.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => void onGenerate?.()}
        disabled={!canStartGeneration}
        className={[
          'mt-4 flex h-10 w-full items-center justify-center gap-2',
          'rounded-lg bg-accent px-4 text-sm font-medium text-white',
          'transition-colors hover:bg-accent-hover',
          'disabled:cursor-not-allowed disabled:opacity-50',
        ].join(' ')}
      >
        <Sparkles size={16} />

        {isGenerating || pullRequest?.status === 'pending'
          ? 'Генерация...'
          : pullRequest
            ? 'Сгенерировать заново'
            : 'Сгенерировать PR'}
      </button>
    </section>
  );
}