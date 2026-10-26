import type { ReactNode } from 'react';

interface AppHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AppHeader({
  title,
  description,
  actions,
}: AppHeaderProps) {
  return (
    <header className="flex min-h-[72px] items-center justify-between gap-6 border-b border-border px-6 py-4">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-medium text-text-primary">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-xs text-text-muted">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}