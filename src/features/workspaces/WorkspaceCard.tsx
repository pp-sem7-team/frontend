import { Link } from 'react-router';
import { ArrowUpRight, FolderGit2 } from 'lucide-react';

import type { Workspace } from '../../types/api';

interface WorkspaceCardProps {
  workspace: Workspace;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link
      to={`/workspaces/${workspace.id}`}
      className={[
        'group flex min-h-[160px] flex-col justify-between',
        'rounded-xl border border-border bg-surface p-5',
        'transition-colors duration-150',
        'hover:border-border-strong hover:bg-surface-hover',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <FolderGit2 size={20} />
        </div>

        <ArrowUpRight
          size={17}
          className="text-text-muted transition-colors group-hover:text-text-primary"
        />
      </div>

      <div>
        <h3 className="truncate text-[15px] font-semibold text-text-primary">
          {workspace.name}
        </h3>

        <p className="mt-1 text-xs text-text-muted">
          Рабочая область
        </p>
      </div>
    </Link>
  );
}