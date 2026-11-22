import { createBrowserRouter, Navigate } from 'react-router';
import { SessionGate } from '../auth/SessionGate';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { WorkspacesPage } from '../pages/WorkspacesPage';
import { BranchWorkspacePage } from '../pages/BranchWorkspacePage';
import { WorkspacePage } from '../pages/WorkspacePage';

export const router = createBrowserRouter([
  {
    element: <SessionGate guest />,
    children: [
      { path: '/', element: <Navigate to="/workspaces" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <SessionGate />,
    children: [
      { path: '/workspaces', element: <WorkspacesPage /> },
      { path: '/workspaces/:workspaceId', element: <WorkspacePage /> },
      { path: '/branches/:branchId', element: <BranchWorkspacePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/workspaces" replace /> },
]);
