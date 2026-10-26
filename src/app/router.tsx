import { createBrowserRouter, Navigate } from 'react-router';

import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { WorkspacesPage } from '../pages/WorkspacesPage';
import { BranchesPage } from '../pages/BranchesPage';
import { BranchWorkspacePage } from '../pages/BranchWorkspacePage';

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
    element: <BranchesPage />,
  },
  {
    path: '/branches/:branchId',
    element: <BranchWorkspacePage />,
  },
]);