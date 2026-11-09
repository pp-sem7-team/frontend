import { createBrowserRouter, Navigate } from 'react-router';

import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { WorkspacesPage } from '../pages/WorkspacesPage';
import { BranchWorkspacePage } from '../pages/BranchWorkspacePage';
import { WorkspacePage } from '../pages/WorkspacePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/workspaces',
    element: <WorkspacesPage />,
  },
  {
    path: '/workspaces/:workspaceId',
    element: <WorkspacePage />,
  },
  {
    path: '/branches/:branchId',
    element: <BranchWorkspacePage />,
  },
]);