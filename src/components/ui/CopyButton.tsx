import { useState } from 'react';
import { Check, ClipboardCopy } from 'lucide-react';

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="shrink-0">
      <button type="button" onClick={() => void copy()} aria-label={label} className="rounded-md p-2 hover:bg-surface-hover">
        {state === 'copied' ? <Check size={16} /> : <ClipboardCopy size={16} />}
      </button>
      {state === 'copied' && <span role="status" className="sr-only">Скопировано</span>}
      {state === 'error' && <p role="alert" className="max-w-24 text-xs text-danger">Не удалось скопировать</p>}
    </div>
  );
}
