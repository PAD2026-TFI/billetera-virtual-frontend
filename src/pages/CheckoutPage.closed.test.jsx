import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from '@/AppRoutes';
import { resetWallet } from '@/test-utils';
import { useAuthStore } from '@/store/useAuthStore';

const fetchCheckoutLink = vi.fn();
const payCheckoutWithCard = vi.fn();

vi.mock('@/services/mocks/checkoutService', async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    fetchCheckoutLink: (...args) => fetchCheckoutLink(...args),
    payCheckoutWithCard: (...args) => payCheckoutWithCard(...args),
  };
});

const baseLink = {
  token: 'link-real',
  title: 'Curso de React',
  description: 'Pago único',
  merchantName: 'Academia Norte',
  amount: 15000,
  currency: 'ARS',
  status: 'Active',
  expiresAt: new Date(Date.now() + 600000).toISOString(),
  isPayable: true,
};

beforeEach(async () => {
  resetWallet();
  useAuthStore.setState({ session: null });
  fetchCheckoutLink.mockReset();
  payCheckoutWithCard.mockReset();
  const { CheckoutError } = await vi.importActual('@/services/mocks/checkoutService');
  payCheckoutWithCard.mockRejectedValue(new CheckoutError('LINK_NOT_PAYABLE', 'Este link de pago ya no admite pagos o el medio elegido no está habilitado.'));
});

async function payWithApprovedCard(user) {
  render(<MemoryRouter initialEntries={['/checkout?token=link-real']}><AppRoutes /></MemoryRouter>);
  await user.click(await screen.findByRole('tab', { name: 'Tarjeta' }));
  await user.click(screen.getByText('Tarjetas de prueba'));
  await user.click(screen.getByRole('button', { name: /Aprobada/ }));
  await user.click(screen.getByRole('button', { name: /^Pagar \$/ }));
}

describe('Pasarela con un link que ya no admite pagos', () => {
  it('muestra que el link ya fue pagado en lugar de un rechazo', async () => {
    fetchCheckoutLink.mockResolvedValueOnce(baseLink).mockResolvedValueOnce({ ...baseLink, status: 'Completed', isPayable: false });
    const user = userEvent.setup();
    await payWithApprovedCard(user);
    expect(await screen.findByText('Este link ya fue pagado.')).toBeInTheDocument();
    expect(screen.queryByText(/Pago rechazado/)).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Tarjeta' })).not.toBeInTheDocument();
  });

  it('si el link sigue activo explica el problema en español', async () => {
    fetchCheckoutLink.mockResolvedValue(baseLink);
    const user = userEvent.setup();
    await payWithApprovedCard(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Este link de pago ya no admite pagos o el medio elegido no está habilitado.');
  });
});
