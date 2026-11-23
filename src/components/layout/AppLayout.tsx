import type { Branch, Workspace } from '../../types/api';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  workspaces?: Workspace[];
  branches?: Branch[];
  activeWorkspaceId?: string;
  responsive?: boolean;
}

export function AppLayout({ children, workspaces, branches, activeWorkspaceId, responsive = false }: AppLayoutProps) {
  return (
    <div className={`flex min-h-screen bg-background text-text-primary ${responsive
      ? 'max-sm:flex-col max-sm:[&>aside]:h-auto max-sm:[&>aside]:w-full'
      : 'min-w-[1024px]'}`}>
      <Sidebar workspaces={workspaces} branches={branches} activeWorkspaceId={activeWorkspaceId} />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
