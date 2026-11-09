import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

export const mockTiming = { network: 400, settlement: 1800 };

export const TRANSFER_LIMIT = 780400;
export const TOP_UP_LIMIT = 500000;

const mockWalletSummary = {
  holder: { firstName: 'Paulina', lastName: 'Quintero' },
  balance: 152340.75,
  currency: 'ARS',
  account: { cvu: '0000003100012345678901', alias: 'padi.paulina.sol' },
  card: { lastDigits: '4821', expiry: '10/30', status: 'active' },
  monthlySpending: { amount: 48750.2, budget: 80000, changePercent: -12 },
  recentMovements: [
    { id: 'm1', kind: 'transferIn', title: 'Transferencia de Lucía Gómez', detail: 'Transferencia recibida', amount: 25000, status: 'completed', createdAt: '2026-10-31T18:42:00-03:00' },
    { id: 'm2', kind: 'payment', title: 'Café Martínez', detail: 'Pago con QR', amount: -3850, status: 'completed', createdAt: '2026-10-31T09:15:00-03:00' },
    { id: 'm3', kind: 'topUp', title: 'Carga de saldo', detail: 'Mercado Pago', amount: 50000, status: 'pending', createdAt: '2026-10-30T20:03:00-03:00' },
    { id: 'm4', kind: 'transferOut', title: 'Transferencia a Martín Ruiz', detail: 'Transferencia enviada', amount: -12000, status: 'completed', createdAt: '2026-10-29T13:27:00-03:00' },
    { id: 'm5', kind: 'payment', title: 'Supermercado Día', detail: 'Pago con tarjeta', amount: -18430.5, status: 'completed', createdAt: '2026-10-28T19:51:00-03:00' },
    { id: 'm6', kind: 'transferIn', title: 'Transferencia de Diego Sosa', detail: 'Transferencia recibida', amount: 8000, status: 'completed', createdAt: '2026-10-27T11:08:00-03:00' },
    { id: 'm7', kind: 'payment', title: 'Farmacity', detail: 'Pago con QR', amount: -6720, status: 'completed', createdAt: '2026-10-25T17:34:00-03:00' },
    { id: 'm8', kind: 'transferOut', title: 'Transferencia a Sofía Herrera', detail: 'Transferencia enviada', amount: -15000, status: 'completed', createdAt: '2026-10-24T10:12:00-03:00' },
    { id: 'm9', kind: 'topUp', title: 'Carga de saldo', detail: 'Mercado Pago', amount: 30000, status: 'completed', createdAt: '2026-10-22T21:45:00-03:00' },
    { id: 'm10', kind: 'payment', title: 'Librería Rayuela', detail: 'Pago con QR', amount: -2400, status: 'completed', createdAt: '2026-10-20T16:20:00-03:00' },
    { id: 'm11', kind: 'transferIn', title: 'Transferencia de Lucía Gómez', detail: 'Transferencia recibida', amount: 12500, status: 'completed', createdAt: '2026-10-17T12:05:00-03:00' },
    { id: 'm12', kind: 'payment', title: 'Kiosco El Paso', detail: 'Recarga SUBE', amount: -5000, status: 'completed', createdAt: '2026-10-15T08:40:00-03:00' },
    { id: 'm13', kind: 'transferOut', title: 'Transferencia a Martín Ruiz', detail: 'Alquiler compartido', amount: -45000, status: 'completed', createdAt: '2026-10-10T19:12:00-03:00' },
    { id: 'm14', kind: 'topUp', title: 'Carga de saldo', detail: 'Mercado Pago', amount: 100000, status: 'completed', createdAt: '2026-10-05T10:30:00-03:00' },
  ],
  cardRequest: null,
};

(function assignBalanceAfter(summary) {
  let balance = summary.balance;
  for (const movement of summary.recentMovements) {
    if (movement.status !== 'completed') continue;
    movement.balanceAfter = Math.round(balance * 100) / 100;
    balance -= movement.amount;
  }
})(mockWalletSummary);

const mockRecipients = {
  'lucia.gomez.padi': { name: 'Lucía Gómez', cuit: '27384561238', bank: 'padi.', frequent: true },
  'martin.ruiz.padi': { name: 'Martín Ruiz', cuit: '20351234567', bank: 'padi.', frequent: true },
  'diego.sosa.padi': { name: 'Diego Sosa', cuit: '20402345671', bank: 'padi.', frequent: true },
  '0000003100098765432109': { name: 'Sofía Herrera', cuit: '27367654320', bank: 'padi.', frequent: true },
  '2850590940090418135201': { name: 'Tomás Acosta', cuit: '20298765437', bank: 'Banco Macro', frequent: false },
};

export const mockQrPayments = [
  { code: 'QR-CAFE-001', merchant: 'Café Martínez', description: 'Café con leche y medialunas', amount: 3850 },
  { code: 'QR-LIBR-002', merchant: 'Librería Rayuela', description: 'Apuntes de la facultad', amount: 2400 },
  { code: 'QR-KIOS-003', merchant: 'Kiosco El Paso', description: 'Recarga SUBE', amount: 5000 },
];

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function isLiveSession() {
  const token = useAuthStore.getState().session?.token;
  return import.meta.env.MODE !== 'test' && Boolean(token) && token !== 'mock-jwt-token';
}

export function mapCardRequestStatus(status) {
  if (status === 'Delivered') return 'delivered';
  if (status === 'InTransit') return 'shipped';
  if (status === 'Processing' || status === 'Issued') return 'production';
  return 'requested';
}

export function mapBackendMovement(item) {
  const isCredit = item.type === 'Credit';
  const rawAmount = Number(item.amount) || 0;
  const amount = isCredit ? rawAmount : -rawAmount;
  const refCode = String(item.sourceId || item.id || '').slice(0, 8).toUpperCase();
  const counterparty = item.counterpartyName || item.counterpartyAlias;

  if (item.isPayment || item.concept) {
    const concept = item.concept || (isCredit ? 'Cobro recibido' : 'Pago en comercio');
    const title = isCredit
      ? (counterparty ? `Cobro de ${counterparty}` : (item.concept || 'Cobro recibido'))
      : (counterparty ? `Pago a ${counterparty}` : (item.concept || 'Pago en comercio'));

    return {
      id: item.id,
      kind: isCredit ? 'transferIn' : 'payment',
      title,
      detail: item.concept || (refCode ? `Operación #${refCode}` : title),
      amount,
      balanceAfter: Number(item.balanceAfter),
      status: 'completed',
      createdAt: item.createdAt,
      senderName: isCredit ? (counterparty || 'Cliente') : undefined,
      recipient: !isCredit ? { name: counterparty || 'Comercio adherido', alias: item.counterpartyAlias } : undefined,
    };
  }

  if (item.source === 'DevelopmentFunding') {
    const isWelcomeBonus = rawAmount === 50000;
    return {
      id: item.id,
      kind: 'topUp',
      title: isWelcomeBonus ? 'Bono de bienvenida' : 'Carga de saldo',
      detail: isWelcomeBonus ? 'Acreditación inicial padi.' : 'Acreditación en cuenta',
      amount,
      balanceAfter: Number(item.balanceAfter),
      status: 'completed',
      createdAt: item.createdAt,
    };
  }

  if (item.source === 'Transfer') {
    const title = counterparty
      ? (isCredit ? `Transferencia de ${counterparty}` : `Transferencia a ${counterparty}`)
      : (isCredit ? 'Transferencia recibida' : 'Transferencia enviada');

    return {
      id: item.id,
      kind: isCredit ? 'transferIn' : 'transferOut',
      title,
      detail: refCode ? `Operación #${refCode}` : title,
      amount,
      balanceAfter: Number(item.balanceAfter),
      status: 'completed',
      createdAt: item.createdAt,
      senderName: isCredit ? (counterparty || 'Cuenta de origen') : undefined,
      recipient: !isCredit ? { name: counterparty || 'Cuenta de destino', alias: item.counterpartyAlias } : undefined,
    };
  }

  return {
    id: item.id,
    kind: isCredit ? 'transferIn' : 'payment',
    title: isCredit ? 'Cobro acreditado' : 'Pago en comercio',
    detail: 'Pasarela padi.',
    amount,
    balanceAfter: Number(item.balanceAfter),
    status: 'completed',
    createdAt: item.createdAt,
  };
}

export async function fetchWalletSummary() {
  if (!isLiveSession()) {
    await wait(mockTiming.network);
    return structuredClone(mockWalletSummary);
  }

  const sessionUser = useAuthStore.getState().session?.user;
  const profilePromise = api('/api/v1/me/profile').catch(() => sessionUser);

  let wallet;
  try {
    wallet = await api('/api/v1/me/wallet');
  } catch (error) {
    if (error?.status === 404 || error?.code === 'WALLET_NOT_FOUND') {
      wallet = await api('/api/v1/me/wallet', { method: 'POST' });
    } else {
      throw error;
    }
  }

  const [profile, movementsPage, cards, cardOrders] = await Promise.all([
    profilePromise,
    api('/api/v1/me/wallet/movements?limit=50').catch(() => ({ items: [] })),
    api('/api/v1/me/cards').catch(() => []),
    api('/api/v1/me/physical-card-orders').catch(() => []),
  ]);

  const recentMovements = Array.isArray(movementsPage?.items)
    ? movementsPage.items.map(mapBackendMovement)
    : [];

  if (recentMovements.length === 0 && Number(wallet.balance) === 50000) {
    recentMovements.push({
      id: `welcome-${wallet.id}`,
      kind: 'topUp',
      title: 'Bono de bienvenida',
      detail: 'Acreditación inicial padi.',
      amount: 50000,
      balanceAfter: 50000,
      status: 'completed',
      createdAt: wallet.createdAt || new Date().toISOString(),
    });
  }

  const primaryCard = Array.isArray(cards) && cards.length > 0 ? cards[0] : null;
  const expMonth = String(primaryCard?.expirationMonth || 12).padStart(2, '0');
  const expYear = String(primaryCard?.expirationYear || 2030).slice(-2);

  const latestOrder = Array.isArray(cardOrders) && cardOrders.length > 0 ? cardOrders[0] : null;
  const cardRequest = latestOrder
    ? {
        id: latestOrder.id,
        status: mapCardRequestStatus(latestOrder.status),
        createdAt: latestOrder.requestedAt,
        address: {
          street: latestOrder.deliveryAddress?.street || '',
          number: latestOrder.deliveryAddress?.number || '',
          floor: '',
          city: latestOrder.deliveryAddress?.city || '',
          province: latestOrder.deliveryAddress?.state || '',
          postalCode: latestOrder.deliveryAddress?.postalCode || '',
        },
      }
    : null;

  const monthlyOutflows = recentMovements
    .filter(m => m.amount < 0)
    .reduce((acc, m) => acc + Math.abs(m.amount), 0);

  return {
    holder: {
      firstName: profile?.firstName || sessionUser?.firstName || 'Usuario',
      lastName: profile?.lastName || sessionUser?.lastName || '',
    },
    balance: Number(wallet.balance) || 0,
    currency: wallet.currency || 'ARS',
    account: {
      id: wallet.id,
      cvu: wallet.cvu || '',
      alias: wallet.alias || '',
    },
    card: {
      id: primaryCard?.id,
      lastDigits: primaryCard?.cardNumberLast4 || '4821',
      expiry: `${expMonth}/${expYear}`,
      status: primaryCard ? (primaryCard.isActive ? 'active' : 'blocked') : 'active',
    },
    monthlySpending: {
      amount: Math.round(monthlyOutflows * 100) / 100,
      budget: 80000,
      changePercent: 0,
    },
    recentMovements,
    cardRequest,
  };
}

export function resolveRecipient(destination) {
  const key = destination.trim().toLowerCase();
  const recipient = mockRecipients[key];
  return recipient ? { destination: key, name: recipient.name, cuit: recipient.cuit, bank: recipient.bank } : null;
}

export const frequentContacts = import.meta.env.MODE === 'test'
  ? Object.keys(mockRecipients)
      .filter(destination => mockRecipients[destination].frequent)
      .map(resolveRecipient)
  : [];

export async function lookupRecipient(destination) {
  if (!isLiveSession()) {
    await wait(mockTiming.network);
    return resolveRecipient(destination);
  }

  const trimmed = destination.trim();
  try {
    const res = await api(`/api/v1/me/transfers/recipient?destination=${encodeURIComponent(trimmed)}`);
    return {
      destination: res.destination || trimmed,
      walletId: res.walletId,
      cvu: res.cvu,
      alias: res.alias,
      name: res.name || res.holderName || trimmed,
      cuit: res.cuit,
      bank: res.bank || 'padi.',
    };
  } catch (error) {
    if (error?.status === 404) {
      return resolveRecipient(trimmed);
    }
    throw error;
  }
}
