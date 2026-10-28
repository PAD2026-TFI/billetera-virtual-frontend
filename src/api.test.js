import { describe, expect, it, vi, afterEach } from 'vitest';
import { api, parseAmount, safeCheckout, readIntent, saveIntent } from './api.js';
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
