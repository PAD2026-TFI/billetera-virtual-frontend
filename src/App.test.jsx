import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

beforeEach(() => {
  useAuthStore.setState({ session: null });
  useNotificationStore.setState({ toasts: [], serviceUnavailable: false });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const renderApp = () => render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>);

describe('avisos', () => {
  it('muestra un aviso y permite cerrarlo', async () => {
    const user = userEvent.setup();
    renderApp();
    act(() => useNotificationStore.getState().notify('No tenés permisos para realizar esta acción.'));
    expect(await screen.findByText('No tenés permisos para realizar esta acción.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText('No tenés permisos para realizar esta acción.')).not.toBeInTheDocument();
  });

  it('el aviso de conexión reintenta contra el backend y se va cuando responde', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'Healthy' }) });
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup();
    renderApp();
    act(() => useNotificationStore.getState().setServiceUnavailable(true));
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/health/ready');
    expect(screen.queryByText('No pudimos conectarnos con el servidor.')).not.toBeInTheDocument();
  });
});

describe('AppErrorBoundary', () => {
  function Broken({ fail }) {
    if (fail.current) throw new Error('falla de render');
    return <p>Pantalla funcionando</p>;
  }

  it('muestra la pantalla de contingencia con un código y se recupera al reintentar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fail = { current: true };
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<AppErrorBoundary><Broken fail={fail} /></AppErrorBoundary>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Algo no salió como esperábamos' })).toBeInTheDocument();
    expect(screen.getByText(/^[0-9A-F]{8}$/)).toBeInTheDocument();
    fail.current = false;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(screen.getByText('Pantalla funcionando')).toBeInTheDocument();
  });
});
