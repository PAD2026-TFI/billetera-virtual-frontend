import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import MovementsPage from './MovementsPage.jsx';
import TopUpPage from './TopUpPage.jsx';
import PayPage from './PayPage.jsx';
import CardPage from './CardPage.jsx';
import { renderAt, resetWallet } from '@/test-utils';
import { useWalletStore } from '@/store/useWalletStore';

beforeEach(resetWallet);

const balance = () => useWalletStore.getState().summary.balance;

describe('Movimientos', () => {
  it('filtra por egresos y busca por texto', async () => {
    const user = userEvent.setup();
    renderAt('/movimientos', <MovementsPage />);
    expect(await screen.findByRole('heading', { name: '14 movimientos' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Egresos' }));
    expect(screen.getByRole('heading', { name: '8 movimientos' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Buscar movimientos'), 'farmacity');
    expect(screen.getByRole('heading', { name: '1 movimiento' })).toBeInTheDocument();
  });
});

describe('Cargar saldo', () => {
  it('carga con un monto sugerido y acredita al confirmar', async () => {
    const user = userEvent.setup();
    renderAt('/cargar', <TopUpPage />);
    await user.click(await screen.findByRole('button', { name: /^\$\s10\.000$/ }));
    await user.click(screen.getByRole('button', { name: 'Continuar a Mercado Pago' }));
    expect(await screen.findByRole('heading', { name: 'Saldo acreditado' })).toBeInTheDocument();
    expect(balance()).toBe(162340.75);
  });

  it('rechaza montos inválidos', async () => {
    const user = userEvent.setup();
    renderAt('/cargar', <TopUpPage />);
    await user.type(await screen.findByLabelText('Monto'), '10,999');
    await user.click(screen.getByRole('button', { name: 'Continuar a Mercado Pago' }));
    expect(screen.getByText('Ingresá un monto con números y hasta dos decimales.')).toBeInTheDocument();
  });
});

describe('Pagar con QR', () => {
  it('paga un código de prueba', async () => {
    const user = userEvent.setup();
    renderAt('/pagar', <PayPage />);
    const codes = (await screen.findByRole('heading', { name: 'Códigos de prueba' })).closest('section');
    await user.click(within(codes).getByRole('button', { name: /Café Martínez/ }));
    await user.click(screen.getByRole('button', { name: 'Pagar' }));
    expect(await screen.findByRole('heading', { name: 'Pago realizado' })).toBeInTheDocument();
    expect(balance()).toBe(148490.75);
  });

  it('avisa si el código no existe', async () => {
    const user = userEvent.setup();
    renderAt('/pagar', <PayPage />);
    await user.type(await screen.findByLabelText('O ingresá el código a mano'), 'QR-NADA');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByText('No encontramos un cobro con ese código.')).toBeInTheDocument();
  });
});

describe('Mi tarjeta', () => {
  it('pide la tarjeta física con una dirección validada', async () => {
    const user = userEvent.setup();
    renderAt('/tarjeta', <CardPage />);
    await user.type(await screen.findByLabelText('Calle'), 'av. mate de luna');
    await user.type(screen.getByLabelText('Altura'), '2140');
    await user.type(screen.getByLabelText('Localidad'), 'san miguel de tucumán');
    await user.selectOptions(screen.getByLabelText('Provincia'), 'Tucumán');
    await user.type(screen.getByLabelText('Código postal'), '4000');
    await user.click(screen.getByRole('button', { name: 'Revisar dirección' }));
    expect(await screen.findByText('Av. Mate de Luna 2140, San Miguel de Tucumán, Tucumán (4000)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pedir tarjeta' }));
    expect(await screen.findByRole('heading', { name: 'Tu tarjeta física está en camino' })).toBeInTheDocument();
    expect(useWalletStore.getState().summary.cardRequest.status).toBe('requested');
  });

  it('valida la altura y el código postal', async () => {
    const user = userEvent.setup();
    renderAt('/tarjeta', <CardPage />);
    await user.type(await screen.findByLabelText('Altura'), 'abc');
    await user.type(screen.getByLabelText('Código postal'), '12');
    await user.click(screen.getByRole('button', { name: 'Revisar dirección' }));
    expect(await screen.findByText('Ingresá solo la altura, en números.')).toBeInTheDocument();
    expect(screen.getByText('Usá 4 números o el formato T4107ABC.')).toBeInTheDocument();
  });
});
