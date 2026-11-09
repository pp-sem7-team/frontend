import { GitBranch } from 'lucide-react';

import type { Branch } from '../../types/api';
import { BranchCard } from './BranchCard';

interface BranchListProps {
  branches: Branch[];
}

export function BranchList({ branches }: BranchListProps) {
  if (branches.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover text-text-secondary">
          <GitBranch size={23} />
        </div>

        <h2 className="text-base font-semibold text-text-primary">
          Веток пока нет
        </h2>

        <p className="mt-2 max-w-[340px] text-sm leading-6 text-text-secondary">
          Создайте первую ветку, чтобы анализировать изменения
          и генерировать сообщения коммитов.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {branches.map((branch) => (
        <BranchCard
          key={branch.id}
          branch={branch}
        />
      ))}
    </div>
  );
}