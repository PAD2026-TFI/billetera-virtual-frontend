const configured = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7081';
export const API_BASE = configured.replace(/\/$/, '');
const base = new URL(API_BASE);
if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))
  throw new Error('La API requiere HTTPS fuera del entorno local.');
export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export async function api(path, { token, key, method = 'GET', body, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, { method, signal, cache: 'no-store', redirect: 'error',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(key ? { 'Idempotency-Key': key } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const messages = {
      PAYMENTS_DISABLED: 'Las cargas todavía no están habilitadas. Falta configurar el entorno de pruebas.',
      INVALID_AMOUNT: 'El importe está fuera del rango permitido o tiene más de dos decimales.',
      IDEMPOTENCY_CONFLICT: 'Esta carga ya tiene otro importe. Recuperá su resultado antes de iniciar otra.',
      PAYMENT_NOT_FOUND: 'La carga no existe o no pertenece a tu cuenta.',
      PROVIDER_UNAVAILABLE: 'No pudimos consultar Mercado Pago. Conservamos tu operación.',
      PROVIDER_TIMEOUT: 'La consulta está demorada. No vuelvas a pagar sin verificar el estado.'
    };
    throw new ApiError(response.status, data?.code,
      messages[data?.code] || (response.status === 401 ? 'Iniciá sesión nuevamente.' : 'No pudimos completar la solicitud. Intentá consultar su estado.'));
  }
  return data;
}
export function parseAmount(value, max) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value)) return null;
  const amount = Number(value.replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 && amount <= max ? amount : null;
}
export function safeCheckout(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'sandbox.mercadopago.com.ar'
    && !u.username && !u.password && !u.port; } catch { return false; }
}
export function saveIntent(userId, intent) { sessionStorage.setItem(`wallet-payment:${userId}`, JSON.stringify(intent)); }
export function readIntent(userId) {
  try { const v = JSON.parse(sessionStorage.getItem(`wallet-payment:${userId}`));
    return v && typeof v.key === 'string' && typeof v.amount === 'number' ? v : null;
  } catch { return null; }
}
export const money = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
