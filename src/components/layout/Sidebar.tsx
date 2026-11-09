import { useState } from 'react';
import { useSession } from '../../auth/useSession';
import { session } from '../../auth/session';
import { Link, NavLink } from 'react-router';
import {
  FolderGit2,
  GitBranch,
  LayoutGrid,
  Plus,
  LogOut,
} from 'lucide-react';

import type { User, Workspace, Branch } from '../../types/api';

interface SidebarProps {
  user?: User | null;
  workspaces?: Workspace[];
  branches?: Branch[];
  activeWorkspaceId?: string;
}

export function Sidebar({
  user: suppliedUser,
  workspaces = [],
  branches = [],
  activeWorkspaceId,
}: SidebarProps) {
  const { user: sessionUser } = useSession();
  const user = suppliedUser ?? sessionUser;
  const [loggingOut, setLoggingOut] = useState(false);
  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-border bg-background">
      <Link
        to="/workspaces"
        className="flex h-[72px] items-center gap-3 px-6"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <GitBranch size={19} strokeWidth={2.5} />
        </div>

        <span className="text-lg font-bold">GitMind</span>
      </Link>

      <nav className="flex-1 px-4">
        <NavLink
          to="/workspaces"
          end
          className={({ isActive }) =>
            [
              'flex h-9 items-center gap-3 rounded-md px-3 text-[13px]',
              isActive
                ? 'bg-accent-soft text-text-primary'
                : 'text-text-secondary hover:bg-surface-hover',
            ].join(' ')
          }
        >
          <LayoutGrid size={16} />
          Рабочие области
        </NavLink>

        <div className="mb-2 mt-7 flex items-center justify-between px-2">
          <span className="text-[10px] uppercase text-text-muted">
            Рабочие области
          </span>

          <Plus size={15} className="text-text-secondary" />
        </div>

        <div className="space-y-1">
          {workspaces.map((workspace) => (
            <div key={workspace.id}>
              <NavLink
                to={`/workspaces/${workspace.id}`}
                className={({ isActive }) =>
                  [
                    'flex h-9 items-center gap-3 rounded-md px-3 text-[13px]',
                    isActive
                      ? 'bg-surface-hover text-text-primary'
                      : 'text-text-secondary hover:bg-surface-hover',
                  ].join(' ')
                }
              >
                <FolderGit2 size={16} className="shrink-0" />

                <span className="truncate">
                  {workspace.name}
                </span>
              </NavLink>

              {activeWorkspaceId === workspace.id && (
                <div className="mt-1 space-y-1 pl-6">
                  {branches
                    .filter(
                      (branch) =>
                        branch.workspace_id === workspace.id,
                    )
                    .map((branch) => (
                      <NavLink
                        key={branch.id}
                        to={`/branches/${branch.id}`}
                        className={({ isActive }) =>
                          [
                            'flex h-8 items-center gap-2 rounded-md px-2 text-xs',
                            isActive
                              ? 'bg-accent-soft text-text-primary'
                              : 'text-text-muted hover:bg-surface-hover',
                          ].join(' ')
                        }
                      >
                        <GitBranch size={14} className="shrink-0" />

                        <span className="truncate font-mono">
                          {branch.name}
                        </span>
                      </NavLink>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="p-4">
        <div className="flex h-[54px] items-center gap-3 rounded-lg border border-border bg-surface px-3">
          <div className="h-7 w-7 shrink-0 rounded-full bg-accent-soft" />

          <span className="min-w-0 flex-1 truncate text-xs font-medium">
            {user?.email ?? 'Пользователь'}
          </span>

          <button type="button" title="Выйти" aria-label="Выйти" disabled={loggingOut} onClick={async () => {
            setLoggingOut(true);
            await session.logout();
          }} className="shrink-0 text-text-muted hover:text-text-primary disabled:opacity-50"><LogOut size={15} /></button>
        </div>
      </div>
    </aside>
  );
}