import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from './AppRoutes.jsx';
import { resetWallet } from '@/test-utils';
import { useAuthStore } from '@/store/useAuthStore';

const user = { id: 'user-1', firstName: 'Paulina' };
const activeSession = () => ({ token: 'jwt', user, expiresAt: Date.now() + 3600000 });

function stubLogin({ status = 200 } = {}) {
  const fetch = vi.fn(async url => {
    const path = new URL(url).pathname;
    if (status !== 200) return { ok: false, status, json: async () => ({}) };
    if (path === '/api/auth/login') return { ok: true, json: async () => ({ accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 3600 }) };
    if (path === '/api/users/me') return { ok: true, json: async () => user };
    throw new Error('Ruta inesperada: ' + path);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const renderAt = path => render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);

async function login(person) {
  await person.type(screen.getByLabelText('Correo electrónico'), 'paulina@example.com');
  await person.type(screen.getByLabelText('Contraseña'), 'Usuario1234!');
  await person.click(screen.getByRole('button', { name: 'Ingresar' }));
}

beforeEach(() => {
  resetWallet();
  useAuthStore.setState({ session: null });
});
afterEach(() => vi.unstubAllGlobals());

describe('rutas protegidas', () => {
  it('sin sesión redirige al login y después vuelve a la ruta pedida', async () => {
    stubLogin();
    const person = userEvent.setup();
    renderAt('/movimientos');
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    await login(person);
    expect(await screen.findByRole('heading', { name: 'Movimientos' })).toBeInTheDocument();
  });

  it('sin ruta previa, el login lleva al dashboard', async () => {
    stubLogin();
    renderAt('/login');
    await login(userEvent.setup());
    expect(await screen.findByRole('navigation', { name: 'Acciones rápidas' })).toBeInTheDocument();
  });

  it('una sesión vencida vuelve a pedir el login', () => {
    useAuthStore.setState({ session: { ...activeSession(), expiresAt: Date.now() - 1 } });
    renderAt('/dashboard');
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('muestra el error y no entra si las credenciales son incorrectas', async () => {
    stubLogin({ status: 401 });
    renderAt('/dashboard');
    await login(userEvent.setup());
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('el retorno de Mercado Pago lleva al sandbox después del login', async () => {
    stubLogin();
    renderAt('/payments/return?status=approved');
    await login(userEvent.setup());
    expect(await screen.findByRole('heading', { name: 'Mi billetera' })).toBeInTheDocument();
  });
});

describe('rutas públicas', () => {
  it('con sesión activa, login y registro redirigen al dashboard', async () => {
    useAuthStore.setState({ session: activeSession() });
    renderAt('/registro');
    expect(await screen.findByRole('navigation', { name: 'Acciones rápidas' })).toBeInTheDocument();
  });

  it('desde el login se llega al registro y se vuelve', async () => {
    const person = userEvent.setup();
    renderAt('/login');
    await person.click(screen.getByRole('button', { name: 'Crear una cuenta' }));
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
    await person.click(screen.getByRole('button', { name: 'Ya tengo cuenta' }));
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });
});

it('cerrar sesión borra la sesión y vuelve al login', async () => {
  useAuthStore.setState({ session: activeSession() });
  const person = userEvent.setup();
  renderAt('/dashboard');
  await person.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
  expect(useAuthStore.getState().session).toBeNull();
  expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
});
