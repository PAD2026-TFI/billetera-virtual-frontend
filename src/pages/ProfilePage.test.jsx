import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import AppRoutes from '@/AppRoutes';
import { resetWallet } from '@/test-utils';
import { useAuthStore } from '@/store/useAuthStore';
import { applyTheme, useThemeStore } from '@/store/useThemeStore';

beforeEach(() => {
  resetWallet();
  localStorage.clear();
  useThemeStore.setState({ theme: 'light' });
  applyTheme('light');
  useAuthStore.setState({
    session: { token: 'jwt', user: { id: 'u1', firstName: 'Paulina', email: 'paulina@example.com' }, expiresAt: Date.now() + 3600000 },
  });
});

const renderAt = path => render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);

describe('Mi perfil', () => {
  it('muestra los datos personales y los de la cuenta', async () => {
    const user = userEvent.setup();
    renderAt('/perfil');
    const personal = (await screen.findByRole('heading', { name: 'Datos personales' })).closest('section');
    expect(within(personal).getByText('Quintero')).toBeInTheDocument();
    expect(within(personal).getByText('paulina@example.com')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /datos para recibir dinero/i }));
    expect(screen.getByText('0000003100012345678901')).toBeInTheDocument();
    expect(screen.getByText('Cuenta activa')).toBeInTheDocument();
  });

  it('cambia el modo oscuro desde las preferencias', async () => {
    const user = userEvent.setup();
    renderAt('/perfil');
    const toggle = await screen.findByRole('switch', { name: 'Modo oscuro' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('cierra la sesión y vuelve al login', async () => {
    const user = userEvent.setup();
    renderAt('/perfil');
    const preferences = (await screen.findByRole('heading', { name: 'Preferencias' })).closest('section');
    await user.click(within(preferences).getByRole('button', { name: 'Cerrar sesión' }));
    expect(useAuthStore.getState().session).toBeNull();
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('permite activar modalidad vendedor y navegar a cobros', async () => {
    const user = userEvent.setup();
    renderAt('/perfil');
    const activateButton = await screen.findByRole('button', { name: 'Activar Vendedor' });
    await user.click(activateButton);

    expect(await screen.findByRole('button', { name: 'Pasar a Personal' })).toBeInTheDocument();
    const goToCollections = screen.getByRole('button', { name: /ir a cobros/i });
    expect(goToCollections).toBeInTheDocument();

    await user.click(goToCollections);
    expect(await screen.findByRole('heading', { name: 'Cobros y Ventas' })).toBeInTheDocument();
  });
});

describe('accesos al perfil', () => {
  it('se abre desde el avatar del inicio', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard');
    await user.click(await screen.findByRole('button', { name: 'Ver mi perfil' }));
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
  });

  it('se abre desde el ícono de usuario de otras pantallas y desde el menú lateral', async () => {
    const user = userEvent.setup();
    renderAt('/movimientos');
    await user.click(await screen.findByRole('button', { name: 'Ver mi perfil' }));
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
    const menu = screen.getByRole('navigation', { name: 'Menú lateral' });
    expect(within(menu).getByRole('button', { name: 'Mi perfil' })).toHaveAttribute('aria-current', 'page');
  });
});
