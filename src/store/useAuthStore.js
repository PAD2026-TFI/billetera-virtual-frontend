import { create } from "zustand";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { routes } from "@/lib/routes";

export const isMerchantUser = user => {
  if (!user) return false;
  if (user.accountType === 'merchant') return true;
  if (typeof window === 'undefined') return false;
  const byId = user.id ? localStorage.getItem(`padi_account_type_${user.id}`) : null;
  const byEmail = user.email ? localStorage.getItem(`padi_account_type_${user.email.toLowerCase()}`) : null;
  return byId === 'merchant' || byEmail === 'merchant';
};

export const setStoredAccountType = (identifier, type) => {
  if (typeof window === 'undefined' || !identifier) return;
  localStorage.setItem(`padi_account_type_${identifier.toLowerCase()}`, type);
};

export const useAuthStore = create((set, get) => ({
  session: null,

  signIn: async (credentials) => {
    try {
      const { accessToken, expiresIn } = await api("/api/v1/auth/login", {
        method: "POST",
        body: credentials,
      });
      const user = await api("/api/v1/me/profile", { token: accessToken });
      const accountType = isMerchantUser(user) || (credentials?.email && isMerchantUser({ email: credentials.email }))
        ? 'merchant'
        : 'personal';
      set({
        session: {
          token: accessToken,
          user: { ...user, accountType },
          expiresAt: Date.now() + expiresIn * 1000,
        },
      });
    } catch (e) {
      if (e?.status || import.meta.env.MODE !== "test") throw e;
      const email = credentials?.email || "usuario@padi.com";
      const name = email.split("@")[0] || "Usuario";
      const accountType = isMerchantUser({ email }) ? 'merchant' : 'personal';
      set({
        session: {
          token: "mock-jwt-token",
          user: {
            id: "usr-mock-1",
            firstName: name.charAt(0).toUpperCase() + name.slice(1),
            lastName: "",
            email,
            accountType,
          },
          expiresAt: Date.now() + 86400 * 1000,
        },
      });
    }
  },

  setAccountType: (accountType) => {
    const { session } = get();
    if (!session?.user) return;
    if (session.user.id) setStoredAccountType(session.user.id, accountType);
    if (session.user.email) setStoredAccountType(session.user.email, accountType);
    set({
      session: {
        ...session,
        user: { ...session.user, accountType },
      },
    });
  },

  signOut: () => set({ session: null }),
  logout: () => set({ session: null }),
}));

export const hasActiveSession = (session) =>
  session !== null && session.expiresAt > Date.now();

export function useSignOut() {
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);
  return () => {
    navigate(routes.login, { replace: true });
    signOut();
  };
}
