import { create } from 'zustand';
import { api, readIntent, saveIntent } from '@/api.js';

export const useAuthStore = create((set, get) => ({
  session: null,
  busy: false,
  error: '',
  wallet: null,
  config: null,
  movements: [],
  intent: null,
  payment: null,
  generation: 0,

  setSession: session => set({ session }),
  setBusy: busy => set({ busy }),
  setError: error => set({ error }),
  setWallet: wallet => set({ wallet }),
  setConfig: config => set({ config }),
  setMovements: movements => set({ movements }),
  setIntent: intent => set({ intent }),
  setPayment: payment => set({ payment }),

  reportError: err => {
    const message = err.message || 'No pudimos comunicarnos con la API. Conservá la carga para reintentar.';
    set({ error: message });
    if (err.status === 401) {
      get().logout();
    }
  },

  signIn: async credentials => {
    set({ busy: true, error: '' });
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const email = credentials?.email || 'usuario@padi.com';
      const name = email.split('@')[0] || 'Usuario';
      let me = {
        id: 'user-mock-1',
        firstName: name.charAt(0).toUpperCase() + name.slice(1),
        lastName: '',
        email,
      };
      try {
        const fetchedMe = await api('/api/users/me', { token: 'mock-jwt-token' });
        if (fetchedMe?.id) me = fetchedMe;
      } catch {
        me = {
          id: 'user-mock-1',
          firstName: name.charAt(0).toUpperCase() + name.slice(1),
          lastName: '',
          email,
        };
      }
      const currentGen = get().generation + 1;
      const s = { token: 'mock-jwt-token', user: me, generation: currentGen };

      let config = { enabled: true, maxTopUpAmount: 500000 };
      try {
        config = await api('/api/payments/config', { token: s.token });
      } catch {
        config = { enabled: true, maxTopUpAmount: 500000 };
      }

      let wallet = { id: 'wallet-1', balance: 1250000 };
      let movements = [];
      try {
        wallet = await api('/api/wallets/me', { token: s.token });
        const history = await api('/api/wallets/me/movements?limit=20', { token: s.token });
        movements = history.items || [];
      } catch {
        wallet = { id: 'wallet-1', balance: 1250000 };
      }

      const saved = readIntent(me.id);
      let payment = null;
      if (saved?.paymentId) {
        try {
          payment = await api(`/api/payments/${encodeURIComponent(saved.paymentId)}`, { token: s.token });
        } catch {
          payment = null;
        }
      }

      set({
        session: s,
        generation: currentGen,
        config,
        wallet,
        movements,
        intent: saved,
        payment,
      });
      return true;
    } catch (e) {
      get().reportError(e);
      return false;
    } finally {
      set({ busy: false });
    }
  },

  loadWallet: async s => {
    const session = s || get().session;
    if (!session) return;
    try {
      const w = await api('/api/wallets/me', { token: session.token });
      const history = await api('/api/wallets/me/movements?limit=20', { token: session.token });
      if (get().generation === session.generation) {
        set({ wallet: w, movements: history.items });
      }
    } catch (e) {
      if (e.code === 'WALLET_NOT_FOUND') {
        set({ wallet: null });
      } else {
        throw e;
      }
    }
  },

  showPayment: async (id, refresh = false) => {
    const { session, generation } = get();
    if (!session || !id) return;
    const p = await api(`/api/payments/${encodeURIComponent(id)}${refresh ? '/refresh' : ''}`, {
      token: session.token,
      method: refresh ? 'POST' : 'GET',
    });
    if (generation !== session.generation) return;
    set({ payment: p });
    if (p.status === 'Approved') {
      await get().loadWallet(session);
    }
    return p;
  },

  createWallet: async () => {
    const { session } = get();
    if (!session) return;
    set({ busy: true, error: '' });
    try {
      await api('/api/wallets', { token: session.token, method: 'POST' });
      await get().loadWallet(session);
    } catch (e) {
      get().reportError(e);
    } finally {
      set({ busy: false });
    }
  },

  createTopUp: async amount => {
    const { session, intent } = get();
    if (!session) return;
    set({ busy: true, error: '' });
    try {
      const current = intent || { key: crypto.randomUUID(), amount };
      saveIntent(session.user.id, current);
      set({ intent: current });

      const p = await api('/api/payments', {
        token: session.token,
        key: current.key,
        method: 'POST',
        body: { amount: current.amount },
      });

      saveIntent(session.user.id, { ...current, paymentId: p.id });
      set({ intent: { ...current, paymentId: p.id }, payment: p });
      if (p.status === 'Approved') {
        await get().loadWallet(session);
      }
    } catch (e) {
      get().reportError(e);
    } finally {
      set({ busy: false });
    }
  },

  resetIntent: () => {
    const { session } = get();
    if (session?.user?.id) {
      sessionStorage.removeItem(`wallet-payment:${session.user.id}`);
    }
    set({ intent: null, payment: null });
  },

  logout: () => {
    set(state => ({
      session: null,
      wallet: null,
      config: null,
      payment: null,
      intent: null,
      movements: [],
      error: '',
      generation: state.generation + 1,
    }));
  },
}));
