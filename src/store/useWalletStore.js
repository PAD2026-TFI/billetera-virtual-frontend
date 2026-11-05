import { create } from 'zustand';
import { fetchWalletSummary, mockTiming, resolveRecipient, wait } from '@/services/mocks/walletService';

const newId = () => `PD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const roundMoney = value => Math.round(value * 100) / 100;
const transferReceipts = new Map();

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
      set({ summary, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },

  toggleBalanceHidden: () => set(state => ({ balanceHidden: !state.balanceHidden })),
  dismissSpending: () => set({ spendingDismissed: true }),

  addMovement: movement =>
    set(state => {
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

  payQr: async ({ merchant, amount, description }) => {
    await wait(mockTiming.network);
    if (amount > get().summary.balance) throw new WalletError('INSUFFICIENT_FUNDS', 'No tenés saldo suficiente para este pago.');
    const movement = {
      id: newId(),
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
