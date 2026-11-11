import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { api, parseAmount, safeCheckout, readIntent, saveIntent } from './api';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
const respond = (status, body) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }));
const toastTitles = () => useNotificationStore.getState().toasts.map(toast => toast.title);
beforeEach(() => {
  useAuthStore.setState({ session: null });
  useNotificationStore.setState({ toasts: [], serviceUnavailable: false });
});
afterEach(() => vi.unstubAllGlobals());
describe('importes y enlaces', () => {
  it('acepta centavos argentinos y rechaza importes fuera de rango', () => {
    expect(parseAmount('1000,50', 100000)).toBe(1000.50);
    for (const v of ['0', '-1', '1.001', '1e3', '100000.01', 'NaN']) expect(parseAmount(v, 100000)).toBeNull();
  });
  it('solamente permite checkout sandbox con HTTPS', () => {
    expect(safeCheckout('https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=p')).toBe(true);
    expect(safeCheckout('https://sandbox.mercadopago.com.ar.evil.example')).toBe(false);
    expect(safeCheckout('javascript:alert(1)')).toBe(false);
  });
  it('conserva intención por usuario sin persistir credenciales', () => {
    saveIntent('ana', { key: 'uuid', amount: 1000, paymentId: 'operation' });
    expect(readIntent('ana').key).toBe('uuid'); expect(readIntent('otro')).toBeNull();
    expect(sessionStorage.getItem('wallet-payment:ana')).not.toContain('token');
  });
});
it('envía JWT y la clave conservada; traduce errores sin exponer cuerpo externo', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ code: 'IDEMPOTENCY_CONFLICT', detail: 'secret' }) });
  vi.stubGlobal('fetch', fetch);
  await expect(api('/api/payments', { token: 'jwt', key: 'same-key', method: 'POST', body: { amount: 1000 } }))
    .rejects.toThrow('Esta carga ya tiene otro importe');
  expect(fetch.mock.calls[0][1].headers['Idempotency-Key']).toBe('same-key');
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt');
});
describe('manejo centralizado de errores', () => {
  it('agrega el token de la sesión activa sin que cada pantalla lo pase', async () => {
    useAuthStore.setState({ session: { token: 'session-jwt', user: {}, expiresAt: Date.now() + 60000 } });
    respond(200, {});
    await api('/api/wallets/me');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer session-jwt');
  });
  it('usa el título del ProblemDetails como mensaje legible', async () => {
    respond(401, { title: 'Correo o contraseña incorrectos.', code: 'INVALID_CREDENTIALS', detail: 'interno' });
    await expect(api('/api/auth/login', { method: 'POST', body: {} })).rejects.toThrow('Correo o contraseña incorrectos.');
    expect(toastTitles()).toEqual([]);
  });
  it('traduce los códigos de correo y DNI ya registrados', async () => {
    respond(409, { code: 'EMAIL_ALREADY_REGISTERED' });
    await expect(api('/api/v1/auth/register', { method: 'POST', body: {} }))
      .rejects.toThrow('Este correo electrónico ya está registrado. Iniciá sesión o usá otro correo.');

    respond(409, { code: 'DNI_ALREADY_REGISTERED' });
    await expect(api('/api/v1/auth/register', { method: 'POST', body: {} }))
      .rejects.toThrow('Este DNI ya está registrado. Revisá el número o iniciá sesión con tu cuenta.');
  });
  it('un 401 con sesión la cierra y avisa que venció', async () => {
    useAuthStore.setState({ session: { token: 'jwt', user: {}, expiresAt: Date.now() + 60000 } });
    respond(401, {});
    await expect(api('/api/wallets/me')).rejects.toMatchObject({ status: 401 });
    expect(useAuthStore.getState().session).toBeNull();
    expect(toastTitles()).toEqual(['Tu sesión venció. Iniciá sesión de nuevo.']);
  });
  it('un 403 muestra un aviso de permisos', async () => {
    respond(403, { title: 'Acceso denegado', code: 'ACCESS_DENIED' });
    await expect(api('/api/wallets/me')).rejects.toMatchObject({ status: 403 });
    expect(toastTitles()).toEqual(['No tenés permisos para realizar esta acción.']);
  });
  it('traduce los errores de validación a errores por campo', async () => {
    respond(400, { code: 'INVALID_INPUT', errors: { Email: ['Campo ausente, inválido o no permitido.'], '$.firstName': ['Requerido.'] } });
    await expect(api('/api/users', { method: 'POST', body: {} })).rejects.toMatchObject({
      fieldErrors: { email: 'Campo ausente, inválido o no permitido.', firstName: 'Requerido.' },
    });
  });
  it('un error del servidor o sin conexión activa el aviso y una respuesta correcta lo quita', async () => {
    respond(503, { title: 'Detalle interno del servidor' });
    await expect(api('/api/wallets/me')).rejects.toThrow('No pudimos conectarnos con el servidor');
    expect(useNotificationStore.getState().serviceUnavailable).toBe(true);
    respond(200, {});
    await api('/health/ready');
    expect(useNotificationStore.getState().serviceUnavailable).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api('/api/wallets/me')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(useNotificationStore.getState().serviceUnavailable).toBe(true);
  });
});
