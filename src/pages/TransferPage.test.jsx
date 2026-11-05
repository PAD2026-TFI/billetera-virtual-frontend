import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import TransferPage from './TransferPage.jsx';
import { renderAt, resetWallet } from '@/test-utils';
import { useWalletStore } from '@/store/useWalletStore';

beforeEach(resetWallet);

const renderPage = () => renderAt('/transferir', <TransferPage />);
const balance = () => useWalletStore.getState().summary.balance;

async function searchNewRecipient(user, destination) {
  await user.click(screen.getByRole('tab', { name: 'Nuevo destinatario' }));
  await user.clear(screen.getByLabelText('Alias, CVU o CBU'));
  await user.type(screen.getByLabelText('Alias, CVU o CBU'), destination);
  await user.click(screen.getByRole('button', { name: 'Buscar cuenta' }));
}

describe('Transferir', () => {
  it('completa los cuatro pasos con un contacto frecuente y actualiza el saldo', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Lucía Gómez/ }));
    expect(await screen.findByText('27-38456123-8')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    const amount = screen.getByLabelText('Monto');
    await user.type(amount, '12500,5');
    expect(amount).toHaveValue('12.500,5');
    expect(screen.getByText('$ 139.840,25')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Motivo'), 'Alquiler');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByRole('heading', { name: 'Revisá antes de confirmar' })).toBeInTheDocument();
    expect(screen.getByText('Inmediata')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar transferencia' }));

    const receipt = await screen.findByRole('status');
    expect(within(receipt).getByRole('heading', { name: 'Transferencia enviada' })).toBeInTheDocument();
    expect(within(receipt).getByText('Alquiler')).toBeInTheDocument();
    expect(balance()).toBe(139840.25);
    expect(useWalletStore.getState().summary.recentMovements[0]).toMatchObject({ title: 'Transferencia a Lucía Gómez', detail: 'Alquiler' });

    await user.click(screen.getByRole('button', { name: 'Realizar otra transferencia' }));
    expect(screen.getByRole('heading', { name: '¿A quién le transferís?' })).toBeInTheDocument();
  });

  it('valida el destinatario: propia cuenta, inexistente y CBU de otro banco', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: '¿A quién le transferís?' });
    await searchNewRecipient(user, 'padi.paulina.sol');
    expect(await screen.findByRole('alert')).toHaveTextContent('No podés transferirte a tu propia cuenta.');
    await searchNewRecipient(user, 'no.existe.padi');
    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos una cuenta');
    await searchNewRecipient(user, '2850590940090418135201');
    expect(await screen.findByText('Banco Macro')).toBeInTheDocument();
    expect(screen.getByText('Tomás Acosta')).toBeInTheDocument();
  });

  it('avisa si el monto supera el saldo o el límite y permite transferir todo el saldo', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Martín Ruiz/ }));
    await user.click(await screen.findByRole('button', { name: 'Continuar' }));
    const amount = screen.getByLabelText('Monto');
    await user.type(amount, '200000');
    expect(screen.getByText(/Supera tu saldo disponible/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Transferir todo el saldo' }));
    expect(amount).toHaveValue('152.340,75');
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();

    useWalletStore.setState(state => ({ summary: { ...state.summary, balance: 1000000 } }));
    await user.clear(amount);
    await user.type(amount, '800000');
    expect(await screen.findByText(/Supera el límite por transferencia/)).toBeInTheDocument();
  });
});

describe('transfer en el store', () => {
  it('con la misma clave de idempotencia no descuenta dos veces', async () => {
    await useWalletStore.getState().loadSummary();
    const request = { destination: 'diego.sosa.padi', amount: 1000, reason: 'Varios', idempotencyKey: crypto.randomUUID() };
    const [first, second] = await Promise.all([useWalletStore.getState().transfer(request), useWalletStore.getState().transfer(request)]);
    expect(second.id).toBe(first.id);
    expect(balance()).toBe(151340.75);
  });
});
