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
  ],
  cardRequest: null,
};

export const mockContacts = {
  'lucia.gomez.padi': 'Lucía Gómez',
  'martin.ruiz.padi': 'Martín Ruiz',
  'diego.sosa.padi': 'Diego Sosa',
  '0000003100098765432109': 'Sofía Herrera',
};

export const mockQrPayments = [
  { code: 'QR-CAFE-001', merchant: 'Café Martínez', description: 'Café con leche y medialunas', amount: 3850 },
  { code: 'QR-LIBR-002', merchant: 'Librería Rayuela', description: 'Apuntes de la facultad', amount: 2400 },
  { code: 'QR-KIOS-003', merchant: 'Kiosco El Paso', description: 'Recarga SUBE', amount: 5000 },
];

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWalletSummary() {
  await wait(mockTiming.network);
  return structuredClone(mockWalletSummary);
}

export function resolveRecipient(destination) {
  const key = destination.trim().toLowerCase();
  return mockContacts[key] ?? null;
}
