import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { IntegrationsContent } from './IntegrationsPage';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({ api: vi.fn(), API_BASE: 'https://api.example.test' }));
const endpoint = '/api/v1/me/merchant/integration';
const metadata = { status: 'NotConfigured', name: null, keyPrefix: null, walletId: 'existing-wallet' };
const secret = 'padi_this-is-a-fixture-not-a-real-credential';
const active = { ...metadata, status: 'Active', name: 'Mi tienda', keyPrefix: 'padi_this' };
const renderPage = () => render(<MemoryRouter><IntegrationsContent /></MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  useAuthStore.setState({ session: { token: 'jwt-fixture', expiresAt: Date.now() + 60000, user: { id: 'seller-1', accountType: 'merchant' } } });
  api.mockResolvedValue(metadata);
});

it('genera la clave una vez y la descarta al cerrar, sin almacenarla en el navegador', async () => {
  const user = userEvent.setup();
  api.mockResolvedValueOnce(metadata).mockResolvedValueOnce({ integration: active, apiKey: secret });
  const view = renderPage();
  await user.type(await screen.findByLabelText('Nombre de la integración'), 'Mi tienda');
  await user.click(screen.getByRole('button', { name: 'Generar API Key' }));
  expect(await screen.findByTestId('issued-api-key')).toHaveTextContent(secret);
  expect(api).toHaveBeenCalledWith(endpoint, { method: 'POST', body: { name: 'Mi tienda' } });
  expect(JSON.stringify(localStorage)).not.toContain(secret);
  expect(JSON.stringify(sessionStorage)).not.toContain(secret);
  await user.click(screen.getByRole('button', { name: 'Ya la guardé' }));
  expect(screen.queryByTestId('issued-api-key')).not.toBeInTheDocument();
  view.unmount(); api.mockResolvedValue(active); renderPage();
  await screen.findByText('Activa');
  expect(screen.queryByTestId('issued-api-key')).not.toBeInTheDocument();
});

it('requiere confirmar la revocación y permite cancelarla sin enviar la solicitud', async () => {
  const user = userEvent.setup(); api.mockResolvedValue(active); renderPage();
  await user.click(await screen.findByRole('button', { name: 'Revocar clave' }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(api.mock.calls.filter(([, options]) => options?.method === 'DELETE')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  await user.click(screen.getByRole('button', { name: 'Revocar clave' }));
  api.mockResolvedValueOnce({ ...active, status: 'Revoked' });
  await user.click(screen.getByRole('button', { name: 'Confirmar revocación' }));
  expect(await screen.findByText('Revocada')).toBeInTheDocument();
  expect(api).toHaveBeenCalledWith(endpoint, { method: 'DELETE' });
});

it('no reintenta generar claves después de un timeout y recupera solo el estado', async () => {
  const user = userEvent.setup();
  api.mockResolvedValueOnce(metadata).mockRejectedValueOnce(new Error('Tiempo agotado')).mockResolvedValueOnce(active);
  renderPage(); await user.type(await screen.findByLabelText('Nombre de la integración'), 'Mi tienda');
  await user.click(screen.getByRole('button', { name: 'Generar API Key' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Consultá el estado');
  await waitFor(() => expect(screen.getByText('Activa')).toBeInTheDocument());
  expect(api.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
  expect(screen.queryByTestId('issued-api-key')).not.toBeInTheDocument();
});

it('redirige a Mi perfil a un usuario personal aunque el navegador conserve la modalidad antigua', async () => {
  localStorage.setItem('padi_account_type_active', 'merchant');
  useAuthStore.setState({ session: { token: 'jwt-fixture', user: { accountType: 'personal' } } });
  renderPage(); expect(screen.getByRole('link', { name: 'Ir a Mi perfil' })).toHaveAttribute('href', '/perfil');
  expect(api).not.toHaveBeenCalled();
});
