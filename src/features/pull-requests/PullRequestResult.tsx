import { useState } from 'react';
import { GitPullRequest, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { RequestState } from '../../components/ui/RequestState';
import { useBranchPullRequest } from '../../hooks/useBranchPullRequest';
import type { PullRequest, PullRequestEdit } from '../../types/api';

export function PullRequestResult({ branchId, readiness }: { branchId: string; readiness: string | null }) {
  const pr = useBranchPullRequest(branchId, readiness);
  const { result, loaded, pending, polling, mutation } = pr;
  const [editing, setEditing] = useState(false);

  async function save(edit: PullRequestEdit) {
    if (await pr.save(edit)) setEditing(false);
  }

  return (
    <section className="min-w-0 rounded-xl border border-border bg-surface p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <GitPullRequest size={19} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Pull Request</h3>
          <p className="mt-1 text-xs text-text-muted">Описание изменений ветки</p>
        </div>
      </div>

      <RequestState loading={!loaded && !polling.error} error={polling.error} retry={polling.retry} />
      <RequestState error={mutation.error} />
      {loaded && !result && (
        <div className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center">
          <GitPullRequest size={23} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-secondary">Описание PR пока не создано</p>
        </div>
      )}
      {pending && <p role="status" className="rounded-lg border border-border bg-background p-4 text-sm">Генерация описания PR…</p>}
      {result?.status === 'failed' && <p role="alert" className="text-sm text-danger">Не удалось сгенерировать описание PR.</p>}

      {result?.status === 'done' && (
        <div className="space-y-3">
          <p role="status" className="text-xs text-text-muted">Генерация завершена.</p>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className="min-w-0 wrap-anywhere text-sm font-semibold">{result.title || 'Заголовок недоступен'}</h4>
              {result.title && <CopyButton key={result.title} text={result.title} label="Скопировать заголовок PR" />}
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <p className="min-w-0 whitespace-pre-wrap wrap-anywhere text-xs leading-6 text-text-secondary">
                {result.description || 'Описание недоступно'}
              </p>
              {result.description && <CopyButton key={result.description} text={result.description} label="Скопировать описание PR" />}
            </div>
          </div>
          {result.is_edited_by_user && <p className="text-xs text-text-muted">Описание отредактировано пользователем.</p>}
        </div>
      )}

      {editing && result?.status === 'done' ? (
        <PullRequestEditor result={result} busy={mutation.busy} onSave={save} onCancel={() => setEditing(false)} />
      ) : loaded && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" loading={mutation.busy} disabled={Boolean(readiness) || pending} leftIcon={<Sparkles size={16} />} onClick={() => void pr.generate()}>
            {result ? 'Сгенерировать заново' : 'Сгенерировать PR'}
          </Button>
          {result?.status === 'done' && (
            <Button size="sm" variant="secondary" disabled={mutation.busy} onClick={() => setEditing(true)}>Редактировать</Button>
          )}
        </div>
      )}
      {loaded && readiness && <p className="mt-3 text-xs text-text-muted">{readiness}</p>}
    </section>
  );
}

function PullRequestEditor({ result, busy, onSave, onCancel }: {
  result: PullRequest;
  busy: boolean;
  onSave: (edit: PullRequestEdit) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(result.title ?? '');
  const [description, setDescription] = useState(result.description ?? '');
  const valid = Boolean(title.trim() && description.trim());
  const field = 'mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm';

  return (
    <form className="mt-4 space-y-3" onSubmit={event => {
      event.preventDefault();
      if (valid && !busy) void onSave({ title: title.trim(), description: description.trim() });
    }}>
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        <label className="block text-xs">Заголовок
          <input required value={title} onChange={event => setTitle(event.target.value)} className={field} />
        </label>
        <label className="block text-xs">Описание
          <textarea required value={description} onChange={event => setDescription(event.target.value)} rows={8} className={`${field} resize-y`} />
        </label>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="submit" disabled={!valid} loading={busy}>Сохранить</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
}
