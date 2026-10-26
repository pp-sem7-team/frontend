import { Plus } from 'lucide-react';
import { useParams } from 'react-router';

import { AppLayout } from '../components/layout/AppLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { BranchList } from '../features/branches/BranchList';

import type { Branch, Workspace } from '../types/api';

interface WorkspacePageProps {
  workspace?: Workspace | null;
  branches?: Branch[];
  onCreateBranch?: () => void;
}

export function WorkspacePage({
  workspace,
  branches = [],
  onCreateBranch,
}: WorkspacePageProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const workspaceName = workspace?.name ?? 'Рабочая область';

  const workspaceBranches = branches.filter(
    (branch) => branch.workspace_id === workspaceId,
  );

  return (
    <AppLayout>
      <AppHeader
        title={workspaceName}
        description="Ветки и история изменений рабочей области"
      />

      <div className="px-8 py-9">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-text-primary">
              Ветки
            </h2>

            <p className="mt-2 text-sm text-text-secondary">
              Управляйте ветками и анализируйте изменения.
            </p>
          </div>

          <Button
            leftIcon={<Plus size={16} />}
            onClick={onCreateBranch}
            disabled={!onCreateBranch}
          >
            Новая ветка
          </Button>
        </div>

        <BranchList branches={workspaceBranches} />
      </div>
    </AppLayout>
  );
}