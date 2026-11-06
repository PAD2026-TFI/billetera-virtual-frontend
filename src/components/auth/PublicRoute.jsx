import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.js';

export default function PublicRoute() {
  const session = useAuthStore(state => state.session);

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
