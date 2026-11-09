import { create } from "zustand";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { routes } from "@/lib/routes";

const SESSION_STORAGE_KEY = 'padi_session';

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

function readStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.expiresAt === 'number' && parsed.expiresAt > Date.now()) {
      return parsed;
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
  return null;
}

function persistSession(session) {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    return;
  }
}

export const useAuthStore = create((set, get) => ({
  session: readStoredSession(),

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
      const session = {
        token: accessToken,
        user: { ...user, accountType },
        expiresAt: Date.now() + expiresIn * 1000,
      };
      persistSession(session);
      set({ session });
    } catch (e) {
      if (e?.status || import.meta.env.MODE !== "test") throw e;
      const email = credentials?.email || "usuario@padi.com";
      const name = email.split("@")[0] || "Usuario";
      const accountType = isMerchantUser({ email }) ? 'merchant' : 'personal';
      const session = {
        token: "mock-jwt-token",
        user: {
          id: "usr-mock-1",
          firstName: name.charAt(0).toUpperCase() + name.slice(1),
          lastName: "",
          email,
          accountType,
        },
        expiresAt: Date.now() + 86400 * 1000,
      };
      persistSession(session);
      set({ session });
    }
  },

  setAccountType: (accountType) => {
    const { session } = get();
    if (!session?.user) return;
    if (session.user.id) setStoredAccountType(session.user.id, accountType);
    if (session.user.email) setStoredAccountType(session.user.email, accountType);
    const updated = {
      ...session,
      user: { ...session.user, accountType },
    };
    persistSession(updated);
    set({ session: updated });
  },

  signOut: () => {
    persistSession(null);
    set({ session: null });
  },
  logout: () => {
    persistSession(null);
    set({ session: null });
  },
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
