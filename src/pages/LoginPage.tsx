import { Link } from 'react-router';

import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  return (
    <AuthLayout>
      <h1 className="text-center text-2xl font-bold">
        Вход
      </h1>

      <p className="mt-2 text-center text-[13px] leading-5 text-text-secondary">
        Войдите, чтобы продолжить работу с Git и ИИ-контекстом.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <Input
          id="email"
          name="email"
          label="Электронная почта"
          type="email"
          placeholder="alex@example.com"
          autoComplete="email"
          required
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs text-text-secondary"
            >
              Пароль
            </label>

            <span className="text-xs text-text-muted">
              Забыли пароль?
            </span>
          </div>

          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Введите пароль"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" className="w-full">
          Войти
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-text-muted">
        Впервые в GitMind?{' '}
        <Link
          to="/register"
          className="text-accent hover:underline"
        >
          Создать аккаунт
        </Link>
      </p>
    </AuthLayout>
  );
}