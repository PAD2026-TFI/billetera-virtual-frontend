import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
const configured = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7081';
export const API_BASE = configured.replace(/\/$/, '');
const base = new URL(API_BASE);
if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))
  throw new Error('La API requiere HTTPS fuera del entorno local.');
const codeMessages = {
  PAYMENTS_DISABLED: 'Las cargas todavía no están habilitadas. Falta configurar el entorno de pruebas.',
  INVALID_AMOUNT: 'El importe está fuera del rango permitido o tiene más de dos decimales.',
  IDEMPOTENCY_CONFLICT: 'Esta carga ya tiene otro importe. Recuperá su resultado antes de iniciar otra.',
  PAYMENT_NOT_FOUND: 'La carga no existe o no pertenece a tu cuenta.',
  PROVIDER_UNAVAILABLE: 'No pudimos consultar Mercado Pago. Conservamos tu operación.',
  PROVIDER_TIMEOUT: 'La consulta está demorada. No vuelvas a pagar sin verificar el estado.',
  EMAIL_ALREADY_REGISTERED: 'Ya existe una cuenta registrada con este correo electrónico.',
  DNI_ALREADY_REGISTERED: 'Ya existe una cuenta registrada con este documento.',
  INSUFFICIENT_FUNDS: 'No tenés saldo suficiente para realizar esta operación.',
  SAME_WALLET: 'No podés transferir dinero a tu propia cuenta.',
  DESTINATION_UNAVAILABLE: 'La cuenta de destino no existe o no está disponible.',
  WALLET_NOT_FOUND: 'Todavía no tenés una billetera activa.',
  WALLET_INACTIVE: 'La billetera se encuentra inactiva para operar.',
  WALLET_CONFLICT: 'Hubo un conflicto al procesar la operación. Intentá nuevamente.',
  PAYMENT_LINK_NOT_FOUND: 'El enlace de cobro no existe o no está disponible.',
  PAYMENT_LINK_EXPIRED: 'Este enlace de cobro ya venció.',
  PAYMENT_LINK_ALREADY_PAID: 'Este enlace de cobro ya fue abonado.',
  CARD_REJECTED: 'La tarjeta fue rechazada. Revisá los datos e intentá con otro medio.',
  INVALID_IDEMPOTENCY_KEY: 'Falta el identificador de seguridad de la operación.',
  DUPLICATE_ACTIVE_CARD_REQUEST: 'Ya tenés una solicitud de tarjeta física en curso.',
  INVALID_ADDRESS: 'Revisá los datos del domicilio de entrega.',
  MERCHANT_REQUIRED: 'Activá la modalidad Vendedor desde Mi perfil.',
  INTEGRATION_CONFLICT: 'La integración cambió. Actualizá su estado antes de volver a intentar.',
  WALLET_UNAVAILABLE: 'Necesitás una billetera activa para generar una API Key.'
};
const sessionExpiredMessage = 'Tu sesión venció. Iniciá sesión de nuevo.';
const forbiddenMessage = 'No tenés permisos para realizar esta acción.';
const unavailableMessage = 'No pudimos conectarnos con el servidor. Revisá tu conexión o intentá en unos minutos.';
const fallbackMessage = 'No pudimos completar la solicitud. Intentá consultar su estado.';
export class ApiError extends Error {
  constructor(status, code, message, fieldErrors = {}) {
    super(message); this.status = status; this.code = code; this.fieldErrors = fieldErrors;
  }
}
const fieldName = key => { const name = key.split('.').at(-1); return name.charAt(0).toLowerCase() + name.slice(1); };
const toFieldErrors = errors => Object.fromEntries(Object.entries(errors ?? {}).map(([key, [message]]) => [fieldName(key), message]));
function toApiError(status, problem) {
  const { session, signOut } = useAuthStore.getState();
  const { notify, setServiceUnavailable } = useNotificationStore.getState();
  if (status === 401 && session) { signOut(); notify(sessionExpiredMessage); }
  if (status === 403) notify(forbiddenMessage);
  if (status >= 500) setServiceUnavailable(true);
  const message = codeMessages[problem?.code] ?? (status >= 500 ? unavailableMessage : problem?.title) ?? fallbackMessage;
  return new ApiError(status, problem?.code, message, toFieldErrors(problem?.errors));
}
export async function api(path, { token = useAuthStore.getState().session?.token, key, method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method, signal, cache: 'no-store', redirect: 'error',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(key ? { 'Idempotency-Key': key } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    useNotificationStore.getState().setServiceUnavailable(true);
    throw new ApiError(0, 'NETWORK_ERROR', unavailableMessage);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, data);
  useNotificationStore.getState().setServiceUnavailable(false);
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
