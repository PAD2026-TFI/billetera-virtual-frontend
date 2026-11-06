import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.js';

export default function ProtectedRoute() {
  const session = useAuthStore(state => state.session);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
