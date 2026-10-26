import { GitBranch } from 'lucide-react';
import { useParams } from 'react-router';
import { DiffInput } from '../features/changes/DiffInput';
import { AppLayout } from '../components/layout/AppLayout';
import { AppHeader } from '../components/layout/AppHeader';
import { CommitResult } from '../features/commits/CommitResult';
import type { Branch } from '../types/api';
import { ChangeHistory } from '../features/history/ChangeHistory';
import { PullRequestResult } from '../features/pull-requests/PullRequestResult';

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
      <AppHeader
        title={currentBranch?.name ?? 'Ветка'}
        description="Анализ изменений, коммиты и Pull Request"
      />

      <div className="px-8 py-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <GitBranch size={22} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {currentBranch?.name ?? 'Работа с веткой'}
            </h2>

            <p className="mt-1 text-sm text-text-secondary">
              Анализируйте изменения и подготавливайте коммиты.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6">
          <section className="min-w-0 space-y-6">
            <DiffInput />
            <CommitResult />
          </section>

          <aside className="space-y-6">
            <ChangeHistory />
            <PullRequestResult />
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}