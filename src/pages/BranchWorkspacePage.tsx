import { useParams } from 'react-router';

import { AppLayout } from '../components/layout/AppLayout';
import { DiffInput } from '../features/changes/DiffInput';
import { ChangeHistory } from '../features/history/ChangeHistory';
import { PullRequestResult } from '../features/pull-requests/PullRequestResult';

import type { Branch } from '../types/api';

interface BranchWorkspacePageProps {
  branch?: Branch | null;
}

export function BranchWorkspacePage({
  branch,
}: BranchWorkspacePageProps) {
  const { branchId } = useParams<{ branchId: string }>();

  const currentBranch =
    branch?.id === branchId ? branch : null;

  return (
    <AppLayout>
      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Верхняя панель */}
        <header className="border-b border-border">
          <div className="flex min-h-[64px] items-center justify-between gap-4 px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-sm text-text-secondary">
                Рабочая область
              </span>

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
          <div
            className={[
              'grid min-h-[calc(100vh-180px)]',
              'grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.3fr)]',
              'gap-3',
            ].join(' ')}
          >
            {/* Левая колонка — ввод изменений */}
            <div className="min-w-0">
              <DiffInput />
            </div>

            {/* Центральная колонка — история */}
            <div className="min-w-0">
              <ChangeHistory />
            </div>

            {/* Правая колонка — Pull Request */}
            <div className="min-w-0">
              <PullRequestResult />
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}