import { useRef, useState } from 'react';
import { errorMessage } from '../../api/client';
import { Button } from './Button';
import { Input } from './Input';
import { RequestState } from './RequestState';
export function CreateResourceForm({ label, onCreate, onClose }: { label: string; onCreate: (name: string) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  return <form className="mb-6 rounded-xl border border-border bg-surface p-5" onSubmit={async event => {
    event.preventDefault();
    if (submitting.current) return;
    if (!name.trim()) { setError('Введите имя.'); return; }
    submitting.current = true; setBusy(true); setError(null);
    try { await onCreate(name.trim()); onClose(); } catch (error) { setError(errorMessage(error)); }
    finally { submitting.current = false; setBusy(false); }
  }}>
    <Input id="resource-name" label={label} value={name} onChange={event => setName(event.target.value)} autoFocus required disabled={busy} />
    <RequestState error={error} />
    <div className="mt-4 flex gap-3"><Button type="submit" loading={busy}>Создать</Button><Button variant="ghost" onClick={onClose} disabled={busy}>Отмена</Button></div>
  </form>;
}
