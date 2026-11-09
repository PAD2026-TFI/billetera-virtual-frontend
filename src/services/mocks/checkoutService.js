import { detectCardBrand, onlyDigits, simulatedRejection } from '@/lib/cards';
import { api } from '@/services/api';
import { mockTiming, wait } from './walletService';

export const testCards = [
  { label: 'Aprobada', number: '4509 9535 6623 3704', cvv: '123' },
  { label: 'Fondos insuficientes', number: '4509 9535 0003 0000', cvv: '123' },
  { label: 'Tarjeta bloqueada', number: '5256 3412 0000 9999', cvv: '123' },
];

const minutesFromNow = minutes => new Date(Date.now() + minutes * 60000).toISOString();

const paymentLinks = {
  'techstore-auriculares': {
    title: 'Auriculares inalámbricos',
    description: 'Pedido #4821 · Envío incluido',
    merchantName: 'Tech Store SRL',
    amount: 45999.99,
    status: 'Active',
    ttlMinutes: 15,
  },
  'rayuela-apuntes': {
    title: 'Apuntes de Análisis Matemático',
    description: 'Retiro en el local',
    merchantName: 'Librería Rayuela',
    amount: 8400,
    status: 'Active',
    ttlMinutes: 60,
  },
  'techstore-vencido': {
    title: 'Funda para notebook',
    description: 'Pedido #4790',
    merchantName: 'Tech Store SRL',
    amount: 12500,
    status: 'Expired',
    ttlMinutes: 0,
  },
};

const expirations = new Map();

export function registerMockPaymentLink(link) {
  if (!link || !link.token) return;
  paymentLinks[link.token] = {
    title: link.title,
    description: link.description || 'Cobro con pasarela padi.',
    merchantName: link.merchantName || 'Comercio adherido padi.',
    amount: link.amount,
    status: link.status || 'Active',
    ttlMinutes: 60,
  };
}

export class CheckoutError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function isMockToken(token) {
  return Boolean(paymentLinks[token]) || import.meta.env.MODE === 'test';
}

function findLink(token) {
  const link = paymentLinks[token];
  if (!link) throw new CheckoutError('PAYMENT_LINK_NOT_FOUND', 'Este link de pago no existe.');
  if (!expirations.has(token)) expirations.set(token, minutesFromNow(link.ttlMinutes));
  return link;
}

export async function fetchCheckoutLink(token) {
  if (!isMockToken(token)) {
    try {
      const details = await api(`/api/v1/public/payment-links/${encodeURIComponent(token)}`);
      return {
        id: details.id,
        token: details.token || token,
        title: details.title,
        description: details.description || 'Cobro con pasarela padi.',
        merchantName: details.merchantName || 'Comercio adherido padi.',
        amount: Number(details.amount),
        currency: details.currency || 'ARS',
        status: details.status,
        expiresAt: details.expiresAt || minutesFromNow(30),
        isPayable: Boolean(details.isPayable),
        merchantOwnerId: details.merchantOwnerId,
        destinationWalletId: details.destinationWalletId,
      };
    } catch (error) {
      throw new CheckoutError(
        error?.code || 'PAYMENT_LINK_NOT_FOUND',
        error?.message || 'Este link de pago no existe.',
      );
    }
  }

  await wait(mockTiming.network);
  const link = findLink(token);
  return {
    token,
    title: link.title,
    description: link.description,
    merchantName: link.merchantName,
    amount: link.amount,
    currency: 'ARS',
    status: link.status,
    expiresAt: expirations.get(token),
    isPayable: link.status === 'Active',
  };
}

function payableLink(token) {
  const link = findLink(token);
  if (link.status !== 'Active') throw new CheckoutError('LINK_NOT_PAYABLE', 'Este link ya no admite pagos.');
  return link;
}

function receiptFor(token, paymentMethod, extra = {}) {
  const link = findLink(token);
  link.status = 'Completed';
  return {
    paymentId: crypto.randomUUID(),
    token,
    amount: link.amount,
    currency: 'ARS',
    paymentMethod,
    status: 'Approved',
    paidAt: new Date().toISOString(),
    ...extra,
  };
}

export async function payCheckoutWithCard(token, card) {
  if (!isMockToken(token)) {
    const digits = onlyDigits(card.number);
    const [rawMonth, rawYear] = String(card.expiry || '12/30').split('/');
    const expirationMonth = Number(rawMonth) || 12;
    const expirationYear = Number(rawYear?.length === 2 ? `20${rawYear}` : rawYear) || 2030;

    try {
      const res = await api('/api/v1/public/checkout/payments', {
        method: 'POST',
        key: crypto.randomUUID(),
        body: {
          token,
          paymentMethod: 'Card',
          card: {
            cardNumber: digits,
            cardHolderName: card.holder || 'TITULAR',
            expirationMonth,
            expirationYear,
            cvv: card.cvv || '123',
          },
        },
      });
      return {
        paymentId: res.paymentId || res.id || crypto.randomUUID(),
        token: res.token || token,
        amount: Number(res.amount),
        currency: res.currency || 'ARS',
        paymentMethod: 'Card',
        status: 'Approved',
        paidAt: res.completedAt || res.paidAt || new Date().toISOString(),
        authorizationCode: res.authorizationCode || 'AUTH-OK',
        cardBrand: detectCardBrand(digits),
        cardLast4: digits.slice(-4),
      };
    } catch (error) {
      throw new CheckoutError(
        error?.code || 'CARD_REJECTED',
        error?.message || 'Pago rechazado por la entidad emisora.',
      );
    }
  }

  await wait(mockTiming.network);
  payableLink(token);
  const rejection = simulatedRejection(card);
  if (rejection) throw new CheckoutError(rejection.code, rejection.message);
  const digits = onlyDigits(card.number);
  return receiptFor(token, 'Card', {
    authorizationCode: Math.random().toString(16).slice(2, 10).toUpperCase(),
    cardBrand: detectCardBrand(digits),
    cardLast4: digits.slice(-4),
  });
}

export async function payCheckoutWithWallet(token, debit) {
  if (!isMockToken(token)) {
    try {
      const details = await fetchCheckoutLink(token);
      const res = await api('/api/v1/public/checkout/payments', {
        method: 'POST',
        key: crypto.randomUUID(),
        body: {
          token,
          paymentMethod: 'Wallet',
        },
      });
      await debit({
        merchant: details.merchantName,
        amount: details.amount,
        description: details.title,
        alreadyProcessedInBackend: true,
      });
      return {
        paymentId: res.paymentId || res.id || crypto.randomUUID(),
        token: res.token || token,
        amount: Number(res.amount || details.amount),
        currency: res.currency || 'ARS',
        paymentMethod: 'Wallet',
        status: 'Approved',
        paidAt: res.completedAt || res.paidAt || new Date().toISOString(),
        authorizationCode: res.authorizationCode || 'WALLET-PAY',
      };
    } catch (error) {
      throw new CheckoutError(
        error?.code || 'WALLET_PAYMENT_FAILED',
        error?.message || 'No pudimos procesar el pago con tu billetera.',
      );
    }
  }

  const link = payableLink(token);
  await debit({ merchant: link.merchantName, amount: link.amount, description: link.title });
  return receiptFor(token, 'Wallet');
}
