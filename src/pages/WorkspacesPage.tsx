import { Plus } from 'lucide-react';

import { AppLayout } from '../components/layout/AppLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { WorkspaceList } from '../features/workspaces/WorkspaceList';

import type { Workspace } from '../types/api';

interface WorkspacesPageProps {
  workspaces?: Workspace[];
  onCreateWorkspace?: () => void;
}

export function WorkspacesPage({
  workspaces = [],
  onCreateWorkspace,
}: WorkspacesPageProps) {
  return (
    <AppLayout>
      <AppHeader
        title="Рабочие области"
        description="Репозитории, контекст веток и работа с ИИ"
      />

      <div className="px-8 py-9">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              Рабочие области
            </h2>

            <p className="mt-2 text-sm text-text-secondary">
              Управляйте рабочими областями и контекстом разработки.
            </p>
          </div>

          <Button
            leftIcon={<Plus size={16} />}
            onClick={onCreateWorkspace}
            disabled={!onCreateWorkspace}
          >
            Новая рабочая область
          </Button>
        </div>

        <WorkspaceList workspaces={workspaces} />
      </div>
    </AppLayout>
  );
}