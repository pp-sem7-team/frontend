import { useState } from 'react';
import { GitCommitHorizontal } from 'lucide-react';
import { resources } from '../../api/resources';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { RequestState } from '../../components/ui/RequestState';
import { useMutation } from '../../hooks/useGeneration';
import { commitTypes, type Change, type Commit, type CommitEdit } from '../../types/api';

export function CommitResult({
  change, onSaved,
}: {
  change: Change;
  onSaved: (change: Change, commit: Commit) => void;
}) {
  const { commit } = change;
  const [editing, setEditing] = useState(false);
  const mutation = useMutation('Анализ должен быть завершён. Дождитесь окончания генерации перед повторной попыткой или сохранением.');
  const canGenerate = change.analysis.status === 'done' && commit?.status !== 'pending';
  const commitText = commit?.status === 'done' && commit.type && commit.message
    ? `${commit.type}${commit.scope ? `(${commit.scope})` : ''}: ${commit.message}`
    : null;

  async function generate() {
    if (!canGenerate || mutation.busy) return;
    if (commit?.is_edited_by_user && !window.confirm('Повторная генерация перезапишет ручные изменения коммита. Продолжить?')) return;
    await mutation.run(signal => resources.generateCommit(change.id, signal), result => onSaved(change, result));
  }

  async function save(edit: CommitEdit) {
    if (commit?.status !== 'done') return;
    const saved = await mutation.run(signal => resources.editCommit(change.id, edit, signal), result => onSaved(change, result));
    if (saved) setEditing(false);
  }

  return (
    <section className="mt-4 min-w-0 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <GitCommitHorizontal size={19} />
        </div>
        <h3 className="text-sm font-semibold">Сообщение коммита</h3>
      </div>
      {!commit && <p className="text-sm text-text-muted">Сообщение коммита пока не создано.</p>}
      {commit?.status === 'pending' && <p role="status" className="text-sm">Генерация сообщения коммита…</p>}
      {commit?.status === 'failed' && <p role="alert" className="text-sm text-danger">Не удалось сгенерировать сообщение коммита.</p>}
      {commit?.status === 'done' && (
        <div className="space-y-2">
          <p role="status" className="text-xs text-text-muted">Генерация завершена.</p>
          <p className="wrap-anywhere text-xs text-text-secondary">Тип {commit.type ?? '—'} · Область {commit.scope || '—'}</p>
          {commitText ? (
            <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-background p-3">
              <code className="min-w-0 whitespace-pre-wrap wrap-anywhere text-sm">{commitText}</code>
              <CopyButton key={commitText} text={commitText} label="Скопировать сообщение коммита" />
            </div>
          ) : <p className="whitespace-pre-wrap wrap-anywhere text-sm">{commit.message || 'Результат генерации недоступен.'}</p>}
          {commit.is_edited_by_user && <p className="text-xs text-text-muted">Сообщение отредактировано пользователем.</p>}
        </div>
      )}
      <RequestState error={mutation.error} />
      {editing && commit?.status === 'done' ? (
        <CommitEditor commit={commit} busy={mutation.busy} onSave={save} onCancel={() => setEditing(false)} />
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" loading={mutation.busy} disabled={!canGenerate} onClick={() => void generate()}>
            {commit ? 'Сгенерировать заново' : 'Сгенерировать коммит'}
          </Button>
          {commit?.status === 'done' && (
            <Button size="sm" variant="secondary" disabled={mutation.busy} onClick={() => setEditing(true)}>Редактировать</Button>
          )}
        </div>
      )}
    </section>
  );
}

function CommitEditor({ commit, busy, onSave, onCancel }: {
  commit: Commit;
  busy: boolean;
  onSave: (edit: CommitEdit) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState(commit.type ?? '');
  const [scope, setScope] = useState(commit.scope ?? '');
  const [message, setMessage] = useState(commit.message ?? '');
  const validType = commitTypes.find(value => value === type);
  const field = 'mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm';

  return (
    <form className="mt-4 space-y-3" onSubmit={event => {
      event.preventDefault();
      if (validType && message.trim() && !busy) void onSave({ type: validType, scope: scope.trim() || null, message: message.trim() });
    }}>
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        <label className="block text-xs">Тип
          <select required value={type} onChange={event => setType(event.target.value)} className={field}>
            <option value="">Выберите тип</option>
            {commitTypes.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="block text-xs">Область (необязательно)
          <input value={scope} onChange={event => setScope(event.target.value)} className={field} />
        </label>
        <label className="block text-xs">Сообщение
          <textarea required value={message} onChange={event => setMessage(event.target.value)} rows={4} className={`${field} resize-y`} />
        </label>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="submit" disabled={!validType || !message.trim()} loading={busy}>Сохранить</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
}
