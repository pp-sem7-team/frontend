import type { Branch, Workspace } from '../../types/api';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  workspaces?: Workspace[];
  branches?: Branch[];
  activeWorkspaceId?: string;
}

export function AppLayout({ children, workspaces, branches, activeWorkspaceId }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen min-w-[1024px] bg-background text-text-primary">
      <Sidebar workspaces={workspaces} branches={branches} activeWorkspaceId={activeWorkspaceId} />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
