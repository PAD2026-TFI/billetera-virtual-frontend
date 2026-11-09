import { create } from 'zustand';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/formatters';
import {
  fetchWalletSummary,
  isLiveSession,
  lookupRecipient,
  mapBackendMovement,
  mapCardRequestStatus,
  mockTiming,
  resolveRecipient,
  wait,
} from '@/services/mocks/walletService';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

const newId = () => `PD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const roundMoney = value => Math.round(value * 100) / 100;
const transferReceipts = new Map();
const seenMovementIds = new Set();
let syncInterval = null;

function ensureMovementSync() {
  if (syncInterval || typeof window === 'undefined') return;
  syncInterval = setInterval(async () => {
    if (document.hidden || !isLiveSession()) return;
    try {
      const page = await api('/api/v1/me/wallet/movements?limit=10').catch(() => null);
      if (!page?.items || !Array.isArray(page.items)) return;

      const movements = page.items.map(mapBackendMovement);
      const incomingToNotify = [];

      for (const mov of movements) {
        if (!seenMovementIds.has(mov.id)) {
          seenMovementIds.add(mov.id);
          if (mov.amount > 0) {
            incomingToNotify.push(mov);
          }
        }
      }

      if (incomingToNotify.length > 0) {
        for (const mov of incomingToNotify) {
          const isCollection = mov.kind === 'payment' || mov.title?.toLowerCase().includes('cobro');
          useNotificationStore.getState().notify({
            title: isCollection ? '¡Cobro recibido con éxito!' : '¡Transferencia recibida!',
            description: `${formatCurrency(mov.amount)} • ${mov.title}`,
            type: 'transfer',
          });
        }
        const state = useWalletStore.getState();
        if (state.status === 'ready') {
          const fresh = await fetchWalletSummary().catch(() => null);
          if (fresh) useWalletStore.setState({ summary: fresh });
        }
      }
    } catch {
    }
  }, 2500);
}

export class WalletError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export const useWalletStore = create((set, get) => ({
  summary: null,
  status: 'idle',
  balanceHidden: false,
  spendingDismissed: false,

  loadSummary: async () => {
    set({ status: 'loading' });
    try {
      const summary = await fetchWalletSummary();
      if (Array.isArray(summary?.recentMovements)) {
        for (const m of summary.recentMovements) {
          seenMovementIds.add(m.id);
        }
      }
      set({ summary, status: 'ready' });
      ensureMovementSync();
      if (isLiveSession()) {
        api('/api/v1/me/merchant/payment-links')
          .then(links => {
            if (Array.isArray(links) && links.length > 0) {
              const auth = useAuthStore.getState();
              if (auth.session?.user && auth.session.user.accountType !== 'merchant') {
                auth.setAccountType('merchant');
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      set({ status: 'error' });
    }
  },

  toggleBalanceHidden: () => set(state => ({ balanceHidden: !state.balanceHidden })),
  dismissSpending: () => set({ spendingDismissed: true }),

  addMovement: movement =>
    set(state => {
      if (!state.summary) return state;
      const completed = movement.status === 'completed';
      const balance = completed ? roundMoney(state.summary.balance + movement.amount) : state.summary.balance;
      return {
        summary: {
          ...state.summary,
          balance,
          recentMovements: [completed ? { ...movement, balanceAfter: balance } : movement, ...state.summary.recentMovements],
        },
      };
    }),

  transfer: async ({ destination, amount, reason, idempotencyKey }) => {
    if (transferReceipts.has(idempotencyKey)) return transferReceipts.get(idempotencyKey);

    if (isLiveSession()) {
      const trimmed = destination.trim();
      const isCvu = /^\d{22}$/.test(trimmed);
      const recipientInfo = (await lookupRecipient(trimmed).catch(() => null)) ||
        resolveRecipient(trimmed) || {
          destination: trimmed,
          name: trimmed,
          cuit: '20351234564',
          bank: 'padi.',
        };

      try {
        const result = await api(
          isCvu ? '/api/v1/me/transfers/by-cvu' : '/api/v1/me/transfers/by-alias',
          {
            method: 'POST',
            key: idempotencyKey,
            body: isCvu ? { cvu: trimmed, amount } : { alias: trimmed.toLowerCase(), amount },
          },
        );
        const movement = {
          id: result.transferId || newId(),
          kind: 'transferOut',
          title: `Transferencia a ${recipientInfo.name}`,
          detail: reason,
          amount: -amount,
          status: 'completed',
          createdAt: result.createdAt || new Date().toISOString(),
        };
        get().addMovement(movement);
        const receipt = { ...movement, recipient: recipientInfo };
        transferReceipts.set(idempotencyKey, receipt);
        return receipt;
      } catch (error) {
        if (error?.code === 'DESTINATION_UNAVAILABLE' && resolveRecipient(trimmed)) {
          const { summary } = get();
          if (amount > summary.balance) {
            throw new WalletError('INSUFFICIENT_FUNDS', 'No tenés saldo suficiente para esta transferencia.');
          }
          const movement = {
            id: newId(),
            kind: 'transferOut',
            title: `Transferencia a ${recipientInfo.name}`,
            detail: reason,
            amount: -amount,
            status: 'completed',
            createdAt: new Date().toISOString(),
          };
          get().addMovement(movement);
          const receipt = { ...movement, recipient: recipientInfo };
          transferReceipts.set(idempotencyKey, receipt);
          return receipt;
        }
        throw new WalletError(error?.code || 'TRANSFER_FAILED', error?.message || 'No pudimos completar la transferencia.');
      }
    }

    await wait(mockTiming.network);
    if (transferReceipts.has(idempotencyKey)) return transferReceipts.get(idempotencyKey);
    const { summary } = get();
    const recipient = resolveRecipient(destination);
    if (!recipient) throw new WalletError('RECIPIENT_NOT_FOUND', 'No encontramos una cuenta con ese alias o CVU.');
    if (amount > summary.balance) throw new WalletError('INSUFFICIENT_FUNDS', 'No tenés saldo suficiente para esta transferencia.');
    const movement = {
      id: newId(),
      kind: 'transferOut',
      title: `Transferencia a ${recipient.name}`,
      detail: reason,
      amount: -amount,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    get().addMovement(movement);
    const receipt = { ...movement, recipient };
    transferReceipts.set(idempotencyKey, receipt);
    return receipt;
  },

  topUp: async amount => {
    await wait(mockTiming.network);
    const movement = {
      id: newId(),
      kind: 'topUp',
      title: 'Carga de saldo',
      detail: 'Mercado Pago',
      amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    get().addMovement(movement);
    return movement;
  },

  confirmTopUp: async id => {
    await wait(mockTiming.settlement);
    set(state => {
      const target = state.summary.recentMovements.find(movement => movement.id === id);
      if (!target || target.status !== 'pending') return state;
      const balance = roundMoney(state.summary.balance + target.amount);
      return {
        summary: {
          ...state.summary,
          balance,
          recentMovements: state.summary.recentMovements.map(movement =>
            movement.id === id ? { ...movement, status: 'completed', balanceAfter: balance } : movement,
          ),
        },
      };
    });
    return get().summary.recentMovements.find(movement => movement.id === id);
  },

  payQr: async ({ code, token, isBackendLink, merchant, amount, description, alreadyProcessedInBackend }) => {
    if (isBackendLink && isLiveSession() && !alreadyProcessedInBackend) {
      const res = await api('/api/v1/public/checkout/payments', {
        method: 'POST',
        key: crypto.randomUUID(),
        body: {
          token: token || code,
          paymentMethod: 'Wallet',
        },
      });
      const movement = {
        id: res.paymentId || res.id || newId(),
        code: token || code,
        merchant,
        description: description ?? 'Pago con QR',
        kind: 'payment',
        title: merchant,
        detail: description ?? 'Pago con QR',
        amount: -amount,
        status: 'completed',
        createdAt: res.completedAt || new Date().toISOString(),
      };
      get().addMovement(movement);
      return movement;
    }
    if (!alreadyProcessedInBackend) await wait(mockTiming.network);
    if (amount > get().summary.balance) throw new WalletError('INSUFFICIENT_FUNDS', 'No tenés saldo suficiente para este pago.');
    const movement = {
      id: newId(),
      code,
      merchant,
      description: description ?? 'Pago con QR',
      kind: 'payment',
      title: merchant,
      detail: description ?? 'Pago con QR',
      amount: -amount,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    get().addMovement(movement);
    return movement;
  },

  requestPhysicalCard: async address => {
    if (isLiveSession()) {
      const response = await api('/api/v1/me/physical-card-orders', {
        method: 'POST',
        body: {
          type: 'Debit',
          deliveryAddress: {
            street: address.street,
            number: address.number,
            city: address.city,
            state: address.province,
            postalCode: address.postalCode,
            country: 'Argentina',
          },
        },
      });
      const cardRequest = {
        id: response.id || newId(),
        address,
        status: mapCardRequestStatus(response.status),
        createdAt: response.requestedAt || new Date().toISOString(),
      };
      set(state => ({ summary: { ...state.summary, cardRequest } }));
      return cardRequest;
    }

    await wait(mockTiming.network);
    const cardRequest = {
      id: newId(),
      address,
      status: 'requested',
      createdAt: new Date().toISOString(),
    };
    set(state => ({ summary: { ...state.summary, cardRequest } }));
    return cardRequest;
  },
}));

useAuthStore.subscribe((state, prevState) => {
  if (!state.session && prevState.session) {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
    seenMovementIds.clear();
    useWalletStore.setState({ summary: null, status: 'idle' });
  }
});
