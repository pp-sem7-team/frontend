import { Button } from '../components/ui/Button';
import { AnalysisStatus } from '../features/changes/AnalysisStatus';
import { Link, useParams } from 'react-router';
import { useCallback } from 'react';
import { resources } from '../api/resources';
import { useResource } from '../hooks/useResource';
import { useBranchChanges } from '../hooks/useBranchChanges';
import { RequestState } from '../components/ui/RequestState';
import { Pagination } from '../components/ui/Pagination';

import { AppLayout } from '../components/layout/AppLayout';
import { DiffInput } from '../features/changes/DiffInput';
import { ChangeHistory } from '../features/history/ChangeHistory';
import { PullRequestResult } from '../features/pull-requests/PullRequestResult';

export function BranchWorkspacePage() {
  const { branchId = '' } = useParams<{ branchId: string }>();
  return <BranchContent key={branchId} branchId={branchId} />;
}
function BranchContent({ branchId }: { branchId: string }) {
  const load = useCallback((signal: AbortSignal) => resources.branch(branchId, signal), [branchId]);
  const branch = useResource(load);
  const currentBranch = branch.data;
  const changes = useBranchChanges(branchId);
  return (
    <AppLayout>
      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Верхняя панель */}
        <header className="border-b border-border">
          <div className="flex min-h-[64px] items-center justify-between gap-4 px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link to={currentBranch ? `/workspaces/${currentBranch.workspace_id}` : '/workspaces'} className="text-sm text-text-secondary hover:underline">
                Рабочая область
              </Link>

              <span className="text-text-muted">/</span>

              <h1 className="truncate font-mono text-sm font-semibold text-text-primary">
                {currentBranch?.name ?? 'Ветка'}
              </h1>

              {currentBranch && (
                <span
                  className={[
                    'shrink-0 rounded-full px-2.5 py-1',
                    'text-xs font-medium',
                    currentBranch.status === 'active'
                      ? 'bg-success-soft text-success'
                      : 'bg-surface-hover text-text-muted',
                  ].join(' ')}
                >
                  {currentBranch.status === 'active'
                    ? 'Активна'
                    : 'Закрыта'}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Основное содержимое */}
        <main className="min-w-0 flex-1 p-4">
          <RequestState loading={branch.loading} error={branch.error} retry={branch.reload} />
          {currentBranch && <div
            className={[
              'grid min-h-[calc(100vh-180px)]',
              'grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.3fr)]',
              'gap-3',
            ].join(' ')}
          >
            {/* Левая колонка — ввод изменений */}
            <div className="min-w-0">
              <DiffInput onAnalyze={changes.submit} isAnalyzing={changes.submitting} disabled={currentBranch.status === 'closed'} />
              {currentBranch.status === 'closed' && <p role="status" className="mt-3 text-sm text-text-muted">Ветка закрыта. Отправка изменений недоступна.</p>}
              <RequestState error={changes.submitError} />
              <RequestState error={changes.pollError} retry={changes.retryPolling} />
              {changes.selected && <AnalysisStatus change={changes.selected} />}
            </div>

            {/* Центральная колонка — история */}
            <div className="min-w-0">
              <ChangeHistory changes={changes.changes} isLoading={changes.history.loading} error={changes.history.error} selectedChangeId={changes.selectedId} onSelectChange={changes.setSelectedId} />
              {changes.history.error && <Button variant="ghost" onClick={changes.history.reload}>Повторить загрузку истории</Button>}
              {changes.history.data && <Pagination offset={changes.history.data.offset} count={changes.history.data.items.length} total={changes.history.data.total} onPage={changes.setOffset} />}
            </div>

            {/* Правая колонка — Pull Request */}
            <div className="min-w-0">
              <PullRequestResult />
            </div>
          </div>}
        </main>
      </div>
    </AppLayout>
  );
}