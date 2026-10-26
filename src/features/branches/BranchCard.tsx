import { Link } from 'react-router';
import { ArrowUpRight, GitBranch } from 'lucide-react';

import type { Branch } from '../../types/api';

interface BranchCardProps {
  branch: Branch;
}

export function BranchCard({ branch }: BranchCardProps) {
  const isActive = branch.status === 'active';

  return (
    <Link
      to={`/branches/${branch.id}`}
      className={[
        'group flex items-center justify-between gap-4',
        'rounded-xl border border-border bg-surface px-5 py-4',
        'transition-colors duration-150',
        'hover:border-border-strong hover:bg-surface-hover',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <GitBranch size={19} />
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-medium text-text-primary">
            {branch.name}
          </h3>

          <p className="mt-1 text-xs text-text-muted">
            Создана{' '}
            {new Intl.DateTimeFormat('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(branch.created_at))}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-medium',
            isActive
              ? 'bg-success-soft text-success'
              : 'bg-surface-hover text-text-muted',
          ].join(' ')}
        >
          {isActive ? 'Активна' : 'Закрыта'}
        </span>

        <ArrowUpRight
          size={17}
          className="text-text-muted transition-colors group-hover:text-text-primary"
        />
      </div>
    </Link>
  );
}