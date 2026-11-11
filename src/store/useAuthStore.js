import { create } from "zustand";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { routes } from "@/lib/routes";

const SESSION_STORAGE_KEY = 'padi_session';
const ACTIVE_ACCOUNT_TYPE_KEY = 'padi_account_type_active';

export const isMerchantUser = user => {
  if (!user) return false;
  if (user.accountType === 'merchant') return true;
  if (user.accountType === 'personal') return false;
  if (typeof window === 'undefined') return false;
  const idKey = user.id ? String(user.id).trim().toLowerCase() : null;
  const emailKey = user.email ? String(user.email).trim().toLowerCase() : null;
  const byId = idKey ? localStorage.getItem(`padi_account_type_${idKey}`) : null;
  const byEmail = emailKey ? localStorage.getItem(`padi_account_type_${emailKey}`) : null;
  const globalActive = localStorage.getItem(ACTIVE_ACCOUNT_TYPE_KEY);
  return byId === 'merchant' || byEmail === 'merchant' || globalActive === 'merchant';
};

export const setStoredAccountType = (identifier, type) => {
  if (typeof window === 'undefined') return;
  if (type === 'merchant') {
    localStorage.setItem(ACTIVE_ACCOUNT_TYPE_KEY, 'merchant');
  } else if (type === 'personal') {
    localStorage.removeItem(ACTIVE_ACCOUNT_TYPE_KEY);
  }
  if (!identifier) return;
  localStorage.setItem(`padi_account_type_${String(identifier).trim().toLowerCase()}`, type);
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

async function startSession(set, { accessToken, expiresIn }, credentials, explicitAccountType) {
  const user = await api("/api/v1/me/profile", { token: accessToken });
  const emailKey = (credentials?.email || user?.email || '').trim().toLowerCase();
  const isExplicitMerchant = explicitAccountType === 'merchant';
  const isStoredMerchant =
    isMerchantUser(user) ||
    (emailKey && isMerchantUser({ email: emailKey })) ||
    (user?.id && isMerchantUser({ id: user.id }));
  const accountType = ['merchant', 'personal'].includes(user.accountType)
    ? user.accountType
    : isExplicitMerchant || isStoredMerchant ? 'merchant' : 'personal';

  if (accountType === 'merchant') {
    setStoredAccountType(null, 'merchant');
    if (user?.id) setStoredAccountType(user.id, 'merchant');
    if (user?.email) setStoredAccountType(user.email, 'merchant');
    if (emailKey) setStoredAccountType(emailKey, 'merchant');
  }

  const session = {
    token: accessToken,
    user: { ...user, accountType },
    expiresAt: Date.now() + expiresIn * 1000,
  };
  persistSession(session);
  set({ session });
}

export const useAuthStore = create((set, get) => ({
  session: readStoredSession(),

  signIn: async (credentials, explicitAccountType) => {
    try {
      const result = await api("/api/v1/auth/login", {
        method: "POST",
        body: credentials,
      });
      if (result?.twoFactorRequired) {
        return { twoFactorRequired: true, challengeToken: result.challengeToken };
      }
      await startSession(set, result, credentials, explicitAccountType);
      return { twoFactorRequired: false };
    } catch (e) {
      if (e?.status || import.meta.env.MODE !== "test") throw e;
      const email = (credentials?.email || "usuario@padi.com").trim().toLowerCase();
      const name = email.split("@")[0] || "Usuario";
      const isExplicitMerchant = explicitAccountType === 'merchant';
      const accountType = isExplicitMerchant || isMerchantUser({ email }) ? 'merchant' : 'personal';
      if (accountType === 'merchant') {
        setStoredAccountType(null, 'merchant');
        setStoredAccountType(email, 'merchant');
      }
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

  completeTwoFactor: async ({ challengeToken, code }, credentials, explicitAccountType) => {
    const result = await api('/api/v1/auth/login/two-factor', {
      method: 'POST',
      body: { challengeToken, code },
    });
    await startSession(set, result, credentials, explicitAccountType);
  },

  setAccountType: async (accountType) => {
    const { session } = get();
    if (!session?.user) return;
    if (session.token !== 'mock-jwt-token') {
      await api('/api/v1/me/account-type', { method: 'PUT', body: { accountType }, token: session.token });
    }
    if (get().session?.token !== session.token) return;
    setStoredAccountType(null, accountType);
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_ACCOUNT_TYPE_KEY);
    }
    persistSession(null);
    set({ session: null });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_ACCOUNT_TYPE_KEY);
    }
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
