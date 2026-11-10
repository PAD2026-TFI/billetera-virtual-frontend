import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/services/api';
import { payCheckoutWithCard } from './checkoutService';

vi.mock('@/services/api', () => ({ api: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('pago con tarjeta virtual Padi', () => {
  it('repite una solicitud sin sesión con la misma clave después de un error de red', async () => {
    vi.stubEnv('MODE', 'production');
    const token = 'padi-card-retry-link';
    const card = { number: '9990 0000 0000 0000', holder: 'Titular de prueba', expiry: '12/30', cvv: '123' };
    api.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce({
      paymentId: 'confirmed-payment', token, amount: 1320, currency: 'ARS',
      paidAt: '2026-11-09T12:00:00Z', authorizationCode: 'WALLET-DEBIT',
    });

    await expect(payCheckoutWithCard(token, card)).rejects.toThrow('Sin conexión');
    const [path, request] = api.mock.calls[0];
    expect(path).toBe('/api/v1/public/checkout/padi-card-payments');
    expect(request).toMatchObject({
      token: null, method: 'POST',
      body: { token, card: { expirationMonth: 12, expirationYear: 2030 } },
    });
    expect(sessionStorage.getItem(`padi-card-payment:${token}`)).toBe(request.key);
    await expect(payCheckoutWithCard(token, card)).resolves.toMatchObject({ paymentId: 'confirmed-payment' });
    expect(api.mock.calls[1][1].key).toBe(request.key);
    expect(sessionStorage.getItem(`padi-card-payment:${token}`)).toBeNull();
  });
});
