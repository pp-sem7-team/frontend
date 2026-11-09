import { FolderOpen } from 'lucide-react';

import type { Workspace } from '../../types/api';
import { WorkspaceCard } from './WorkspaceCard';

interface WorkspaceListProps {
  workspaces: Workspace[];
}

export function WorkspaceList({ workspaces }: WorkspaceListProps) {
  if (workspaces.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-text-secondary">
          <FolderOpen size={23} />
        </div>

        <h2 className="text-base font-semibold">
          Рабочих областей пока нет
        </h2>

        <p className="mt-2 max-w-[320px] text-sm leading-6 text-text-secondary">
          Создайте первую рабочую область, чтобы организовать
          работу с ветками и историей изменений.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-5">
      {workspaces.map((workspace) => (
        <WorkspaceCard
          key={workspace.id}
          workspace={workspace}
        />
      ))}
    </div>
  );
}