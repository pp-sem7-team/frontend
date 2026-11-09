import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { session } from './session';
import { useSession } from './useSession';

export function SessionGate({ guest = false }: { guest?: boolean }) {
  const { checking, user } = useSession();
  useEffect(() => { void session.initialize(); }, []);
  if (checking) return <p role="status" className="p-8 text-text-secondary">Проверка сессии...</p>;
  if (guest && user) return <Navigate to="/workspaces" replace />;
  if (!guest && !user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
