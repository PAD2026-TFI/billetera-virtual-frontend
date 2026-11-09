import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import BottomNav from './BottomNav';
import { useAuthStore } from '@/store/useAuthStore';

describe('BottomNav', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ session: null });
  });

  it('muestra las opciones personales por defecto', () => {
    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Movimientos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar con QR' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transferir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tarjeta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cobros' })).not.toBeInTheDocument();
  });

  it('muestra la opcion de cobros cuando el usuario es vendedor', () => {
    useAuthStore.setState({
      session: {
        token: 'token-test',
        expiresAt: Date.now() + 60000,
        user: {
          id: 'usr-123',
          email: 'vendedor@padi.com',
          accountType: 'merchant',
        },
      },
    });

    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cobros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagar con QR' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transferir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Movimientos' })).toBeInTheDocument();
  });
});
