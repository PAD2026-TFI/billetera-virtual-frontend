import { create } from 'zustand';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { routes } from '@/lib/routes';

export const useAuthStore = create(set => ({
  session: null,

  signIn: async credentials => {
    const { accessToken, expiresIn } = await api('/api/auth/login', { method: 'POST', body: credentials });
    const user = await api('/api/users/me', { token: accessToken });
    set({ session: { token: accessToken, user, expiresAt: Date.now() + expiresIn * 1000 } });
  },

  signOut: () => set({ session: null }),
}));

export const hasActiveSession = session => session !== null && session.expiresAt > Date.now();

export function useSignOut() {
  const navigate = useNavigate();
  const signOut = useAuthStore(state => state.signOut);
  return () => {
    navigate(routes.login, { replace: true });
    signOut();
  };
}
