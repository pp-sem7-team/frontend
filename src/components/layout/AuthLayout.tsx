import type { ReactNode } from 'react';
import { GitBranch } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Фиолетовое свечение за формой */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[600px] w-[700px] rounded-full bg-accent/[0.06] blur-[120px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Логотип */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <GitBranch size={19} strokeWidth={2.5} />
          </div>

          <span className="text-lg font-bold text-text-primary">
            GitMind
          </span>
        </div>

        {/* Общая карточка */}
        <section className="w-[420px] rounded-2xl border border-border bg-surface p-8">
          {children}
        </section>
      </div>
    </main>
  );
}