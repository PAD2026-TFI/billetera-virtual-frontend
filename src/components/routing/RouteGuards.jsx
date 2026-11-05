import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { routes } from '@/lib/routes';
import { hasActiveSession, useAuthStore } from '@/store/useAuthStore';

export function ProtectedRoute() {
  const session = useAuthStore(state => state.session);
  const location = useLocation();
  if (!hasActiveSession(session)) return <Navigate to={routes.login} replace state={{ from: location }} />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const session = useAuthStore(state => state.session);
  const location = useLocation();
  if (hasActiveSession(session)) return <Navigate to={location.state?.from ?? routes.home} replace />;
  return <Outlet />;
}
