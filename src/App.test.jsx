import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App.jsx';
const payment = { id: 'operation-1', amount: 1000, status: 'Pending', checkoutUrl: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=p', requiresReview: false };
function setup({ enabled = true, lostResponse = false, saved = false } = {}) {
  let credited = false; let failed = false;
  if (saved) sessionStorage.setItem('wallet-payment:user-1', JSON.stringify({ key: 'persisted-key', amount: 1000, paymentId: payment.id }));
  const fetch = vi.fn(async (url, request) => {
    const path = new URL(url).pathname;
    let body;
    if (path === '/api/auth/login') body = { accessToken: 'jwt' };
    else if (path === '/api/users/me') body = { id: 'user-1', firstName: 'Ana' };
    else if (path === '/api/payments/config') body = { enabled, maxTopUpAmount: 100000 };
    else if (path === '/api/wallets/me') body = { id: 'wallet-1', balance: credited ? 1000 : 0 };
    else if (path === '/api/wallets/me/movements') body = { items: credited ? [{ id: 'movement-1', type: 'Credit', amount: 1000,
      source: 'Payment', balanceAfter: 1000, createdAt: '2026-10-28T00:00:00Z' }] : [] };
    else if (path === '/api/payments' && request.method === 'POST') {
      if (lostResponse && !failed) { failed = true; throw new TypeError('Sin conexión'); }
      body = payment;
    } else if (path.endsWith('/refresh')) { credited = true; body = { ...payment, status: 'Approved' }; }
    else if (path === '/api/payments/operation-1') body = payment;
    else throw new Error('Ruta inesperada: ' + path);
    return { ok: true, json: async () => body };
  });
  vi.stubGlobal('fetch', fetch); render(<App/>); return fetch;
}
async function login(user) {
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Usuario1234!');
  await user.click(screen.getByRole('button', { name: 'Ingresar' }));
  await screen.findByText('Hola, Ana');
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('prepara carga, abre checkout seguro y actualiza saldo sólo después de aprobación del backend', async () => {
  setup(); const user = userEvent.setup(); await login(user);
  await user.type(screen.getByLabelText('Importe en ARS'), '1000');
  await user.click(screen.getByRole('button', { name: 'Preparar carga' }));
  expect(await screen.findByRole('heading', { name: 'Pago pendiente' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Abrir Mercado Pago de prueba' })).toHaveAttribute('href', payment.checkoutUrl);
  expect(screen.queryByText('Carga con Mercado Pago')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Verificar con Mercado Pago' }));
  expect(await screen.findByRole('heading', { name: 'Saldo acreditado' })).toBeInTheDocument();
  expect(await screen.findByText('Carga con Mercado Pago')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Abrir Mercado Pago de prueba' })).not.toBeInTheDocument();
});
it('una respuesta perdida conserva la misma clave e importe al reintentar', async () => {
  const fetch = setup({ lostResponse: true }); const user = userEvent.setup(); await login(user);
  await user.type(screen.getByLabelText('Importe en ARS'), '1000');
  await user.click(screen.getByRole('button', { name: 'Preparar carga' }));
  await screen.findByRole('alert');
  await user.click(screen.getByRole('button', { name: 'Recuperar la misma carga' }));
  await screen.findByRole('heading', { name: 'Pago pendiente' });
  const posts = fetch.mock.calls.filter(([url, r]) => url.endsWith('/api/payments') && r.method === 'POST');
  expect(posts).toHaveLength(2); expect(posts[0][1].headers['Idempotency-Key']).toBe(posts[1][1].headers['Idempotency-Key']);
  expect(posts[0][1].body).toBe(posts[1][1].body);
});
it('recupera la referencia después de recargar e iniciar sesión; ignora status del retorno del navegador', async () => {
  window.history.replaceState({}, '', '/payments/return?status=approved');
  setup({ saved: true }); const user = userEvent.setup(); await login(user);
  expect(await screen.findByRole('heading', { name: 'Pago pendiente' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Saldo acreditado' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Importe en ARS')).toHaveAttribute('readonly');
});
it('explica la configuración pendiente y no permite iniciar cargas deshabilitadas', async () => {
  setup({ enabled: false }); await login(userEvent.setup());
  await waitFor(() => expect(screen.getByText(/Las cargas todavía no están habilitadas/)).toBeInTheDocument());
  expect(screen.queryByRole('button', { name: 'Preparar carga' })).not.toBeInTheDocument();
});
