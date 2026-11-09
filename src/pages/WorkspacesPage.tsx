import { Plus } from 'lucide-react';

import { AppLayout } from '../components/layout/AppLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { WorkspaceList } from '../features/workspaces/WorkspaceList';

import { useCallback, useState } from 'react';
import { resources } from '../api/resources';
import { useResource } from '../hooks/useResource';
import { CreateResourceForm } from '../components/ui/CreateResourceForm';
import { Pagination } from '../components/ui/Pagination';
import { RequestState } from '../components/ui/RequestState';

export function WorkspacesPage() {
  const [offset, setOffset] = useState(0);
  const [creating, setCreating] = useState(false);
  const load = useCallback((signal: AbortSignal) => resources.workspaces(offset, signal), [offset]);
  const { data, loading, error, reload } = useResource(load);
  return (
    <AppLayout workspaces={data?.items}>
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
            onClick={() => setCreating(true)}
            disabled={creating}
          >
            Новая рабочая область
          </Button>
        </div>

        {creating && <CreateResourceForm label="Имя рабочей области" onClose={() => setCreating(false)} onCreate={async name => {
          await resources.createWorkspace(name);
          setOffset(0); reload();
        }} />}
        <RequestState loading={loading} error={error} retry={reload} />
        {!loading && !error && data && <>
          <WorkspaceList workspaces={data.items} />
          <Pagination offset={data.offset} count={data.items.length} total={data.total} onPage={setOffset} />
        </>}
      </div>
    </AppLayout>
  );
}