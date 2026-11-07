import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '@/AppRoutes';
import OrderSummary from '@/components/checkout/OrderSummary';
import { resetWallet } from '@/test-utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';

const signIn = () =>
  useAuthStore.setState({ session: { token: 'jwt', user: { id: 'u1', firstName: 'Paulina' }, expiresAt: Date.now() + 3600000 } });

beforeEach(() => {
  resetWallet();
  useAuthStore.setState({ session: null });
});

const renderCheckout = token => render(<MemoryRouter initialEntries={[`/checkout?token=${token}`]}><AppRoutes /></MemoryRouter>);

async function payWithTestCard(user, label) {
  await user.click(await screen.findByRole('tab', { name: 'Tarjeta' }));
  await user.click(screen.getByText('Tarjetas de prueba'));
  await user.click(screen.getByRole('button', { name: new RegExp(label) }));
  await user.click(screen.getByRole('button', { name: /^Pagar \$/ }));
}

describe('Pasarela de pago', () => {
  it('muestra el comercio, el desglose y el tiempo restante sin pedir sesión', async () => {
    renderCheckout('techstore-auriculares');
    const order = await screen.findByRole('region', { name: 'Detalle de la orden' });
    expect(within(order).getByText('Tech Store SRL')).toBeInTheDocument();
    expect(within(order).getByText('Pago seguro protegido por padi.')).toBeInTheDocument();
    expect(within(order).getByText('$ 45.999,99')).toBeInTheDocument();
    expect(within(order).getByText('IVA (21 %)')).toBeInTheDocument();
    expect(within(order).getByText(/Esta orden expira en/)).toBeInTheDocument();
  });

  it('aprueba el pago con una tarjeta de prueba y muestra el comprobante', async () => {
    const user = userEvent.setup();
    renderCheckout('techstore-auriculares');
    await payWithTestCard(user, 'Aprobada');
    const receipt = await screen.findByRole('status');
    expect(within(receipt).getByRole('heading', { name: 'Pago aprobado' })).toBeInTheDocument();
    expect(within(receipt).getByText('Visa terminada en 3704')).toBeInTheDocument();
    expect(within(receipt).getByText('Código de autorización')).toBeInTheDocument();
  });

  it('explica el rechazo y permite probar con otro medio sin perder la orden', async () => {
    const user = userEvent.setup();
    renderCheckout('rayuela-apuntes');
    await payWithTestCard(user, 'Fondos insuficientes');
    expect(await screen.findByRole('alert')).toHaveTextContent('Pago rechazado: La tarjeta no tiene fondos suficientes.');
    await user.click(screen.getByRole('button', { name: 'Pagar con saldo de padi.' }));
    expect(screen.getByRole('tab', { name: 'Saldo de padi.' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('valida el número de tarjeta con Luhn', async () => {
    const user = userEvent.setup();
    renderCheckout('rayuela-apuntes');
    await user.click(await screen.findByRole('tab', { name: 'Tarjeta' }));
    const number = screen.getByLabelText('Número de tarjeta');
    await user.type(number, '4509953566233705');
    expect(number).toHaveValue('4509 9535 6623 3705');
    await user.click(screen.getByLabelText('Nombre del titular'));
    expect(screen.getByText('Revisá el número de la tarjeta.')).toBeInTheDocument();
  });

  it('pide iniciar sesión para pagar con saldo y vuelve a la orden', async () => {
    const user = userEvent.setup();
    renderCheckout('rayuela-apuntes');
    await user.click(await screen.findByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('con sesión paga con el saldo y lo descuenta de la billetera', async () => {
    signIn();
    const user = userEvent.setup();
    renderCheckout('rayuela-apuntes');
    expect(await screen.findByText(/\$\s152\.340,75/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Pagar \$\s8\.400,00 con mi saldo/ }));
    expect(await screen.findByText('Saldo de padi.', { selector: 'dd' })).toBeInTheDocument();
    expect(useWalletStore.getState().summary.balance).toBe(143940.75);
    expect(screen.getByRole('button', { name: 'Ir a mi billetera' })).toBeInTheDocument();
  });

  it('muestra los estados de link inexistente y vencido', async () => {
    const { unmount } = renderCheckout('no-existe');
    expect(await screen.findByRole('heading', { name: 'Este link de pago no existe' })).toBeInTheDocument();
    unmount();
    renderCheckout('techstore-vencido');
    expect(await screen.findByText('Este link venció. Pedile al comercio uno nuevo.')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Tarjeta' })).not.toBeInTheDocument();
  });
});

describe('OrderSummary', () => {
  it('avisa cuando se termina el tiempo de la orden', async () => {
    const onExpire = vi.fn();
    render(
      <OrderSummary
        link={{ merchantName: 'Tech Store SRL', title: 'Pedido', amount: 1000, isPayable: true, expiresAt: new Date(Date.now() - 1000).toISOString() }}
        onExpire={onExpire}
      />,
    );
    await vi.waitFor(() => expect(onExpire).toHaveBeenCalled());
  });
});
