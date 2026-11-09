import { Plus } from 'lucide-react';
import { useParams } from 'react-router';

import { AppLayout } from '../components/layout/AppLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { BranchList } from '../features/branches/BranchList';

import { useCallback, useState } from 'react';
import { resources } from '../api/resources';
import { useResource } from '../hooks/useResource';
import { CreateResourceForm } from '../components/ui/CreateResourceForm';
import { Pagination } from '../components/ui/Pagination';
import { RequestState } from '../components/ui/RequestState';

export function WorkspacePage() {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  return <WorkspaceContent key={workspaceId} workspaceId={workspaceId} />;
}
function WorkspaceContent({ workspaceId }: { workspaceId: string }) {
  const [offset, setOffset] = useState(0);
  const [creating, setCreating] = useState(false);
  const loadWorkspace = useCallback((signal: AbortSignal) => resources.workspace(workspaceId, signal), [workspaceId]);
  const workspace = useResource(loadWorkspace);
  const load = useCallback((signal: AbortSignal) => resources.branches(workspaceId, offset, signal), [workspaceId, offset]);
  const branches = useResource(load);
  const workspaceName = workspace.data?.name ?? 'Рабочая область';
  return (
    <AppLayout workspaces={workspace.data ? [workspace.data] : []} branches={branches.data?.items} activeWorkspaceId={workspaceId}>
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
            onClick={() => setCreating(true)}
            disabled={creating || !workspace.data}
          >
            Новая ветка
          </Button>
        </div>

        <RequestState loading={workspace.loading} error={workspace.error} retry={workspace.reload} />
        {workspace.data && <>
          {creating && <CreateResourceForm label="Имя ветки" onClose={() => setCreating(false)} onCreate={async name => {
            await resources.createBranch(workspaceId, name);
            setOffset(0); branches.reload();
          }} />}
          <RequestState loading={branches.loading} error={branches.error} retry={branches.reload} />
          {!branches.loading && !branches.error && branches.data && <>
            <BranchList branches={branches.data.items} />
            <Pagination offset={branches.data.offset} count={branches.data.items.length} total={branches.data.total} onPage={setOffset} />
          </>}
        </>}
      </div>
    </AppLayout>
  );
}