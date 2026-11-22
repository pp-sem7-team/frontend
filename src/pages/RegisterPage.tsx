import { useAuthForm } from '../auth/useAuthForm';
import { useSession } from '../auth/useSession';
import { RequestState } from '../components/ui/RequestState';
import { Link } from 'react-router';

import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function RegisterPage() {
  const { busy, error, onSubmit } = useAuthForm('register');
  const { error: sessionError } = useSession();
  return (
    <AuthLayout>
      <h1 className="text-center text-2xl font-bold">
        Регистрация
      </h1>

      <p className="mt-2 text-center text-[13px] leading-5 text-text-secondary">
        Создавайте точные коммиты и PR быстрее с учётом
        <br />
        истории ветки.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={onSubmit}
      >
        <Input
          id="register-email"
          name="email"
          label="Электронная почта"
          type="email"
          placeholder="alex@example.com"
          autoComplete="email"
          disabled={busy}
          required
        />

        <Input
          id="register-password"
          name="password"
          label="Пароль"
          type="password"
          placeholder="Не менее 8 символов"
          autoComplete="new-password"
          minLength={8}
          disabled={busy}
          required
        />

        <Input
          id="register-confirm-password"
          name="confirmPassword"
          label="Повторите пароль"
          type="password"
          placeholder="Введите пароль ещё раз"
          autoComplete="new-password"
          minLength={8}
          disabled={busy}
          required
        />

        <RequestState error={error ?? sessionError} />
        <Button type="submit" className="w-full" loading={busy}>
          Создать аккаунт
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-text-muted">
        Уже есть аккаунт?{' '}
        <Link
          to="/login"
          className="text-accent hover:underline"
        >
          Войти
        </Link>
      </p>
    </AuthLayout>
  );
}