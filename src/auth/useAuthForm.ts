import { useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { errorMessage } from '../api/client';
import { session } from './session';

export function useAuthForm(mode: 'login' | 'register') {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Введите корректный email и пароль.'); return; }
    if (mode === 'register' && password !== data.get('confirmPassword')) { setError('Пароли не совпадают.'); return; }
    submitting.current = true; setBusy(true); setError(null);
    try {
      await session.authenticate(mode, { email, password });
      navigate('/workspaces', { replace: true });
    } catch (error) { setError(errorMessage(error)); }
    finally { submitting.current = false; setBusy(false); }
  }
  return { busy, error, onSubmit };
}
