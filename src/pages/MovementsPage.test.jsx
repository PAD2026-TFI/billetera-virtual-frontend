import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MovementsPage from './MovementsPage.jsx';
import { renderAt, resetWallet } from '@/test-utils';
import { useWalletStore } from '@/store/useWalletStore';

beforeEach(resetWallet);

const renderPage = () => renderAt('/movimientos', <MovementsPage />);

describe('MovementsPage', () => {
  it('agrupa los movimientos por día', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: '31 de octubre de 2026' })).toBeInTheDocument();
    const day = screen.getByRole('heading', { name: '31 de octubre de 2026' }).closest('section');
    expect(within(day).getAllByRole('listitem')).toHaveLength(2);
  });

  it('muestra los totales del período filtrado', async () => {
    const user = userEvent.setup();
    renderPage();
    const summary = await screen.findByLabelText('Resumen del período filtrado');
    await user.click(screen.getByRole('button', { name: 'Pagos QR' }));
    expect(within(summary).getByText(/\+\$\s0,00/)).toBeInTheDocument();
    // Egresos y balance neto coinciden porque no hay ingresos en pagos QR.
    expect(within(summary).getAllByText(/−\$\s36\.400,50/)).toHaveLength(2);
  });

  it('filtra por rango personalizado y permite limpiar los filtros', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(await screen.findByLabelText('Período'), 'custom');
    const from = screen.getByLabelText('Desde');
    await user.type(from, '2026-10-29');
    await user.type(screen.getByLabelText('Hasta'), '2026-10-30');
    expect(screen.getByRole('heading', { name: '2 movimientos' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Buscar movimientos'), 'no existe');
    expect(screen.getByText('No se encontraron movimientos para los filtros seleccionados')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByRole('heading', { name: '14 movimientos' })).toBeInTheDocument();
  });

  it('abre el comprobante con el saldo posterior y copia el número de operación', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /^Transferencia de Lucía Gómez, \+\$\s25\.000,00/ }));
    const receipt = screen.getByRole('dialog');
    expect(within(receipt).getByText(/152\.340,75/)).toBeInTheDocument();
    expect(within(receipt).getByText('31/10/2026, 18:42:00')).toBeInTheDocument();
    await user.click(within(receipt).getByRole('button', { name: 'Copiar número de operación' }));
    expect(writeText).toHaveBeenCalledWith('m1');
    await user.click(within(receipt).getByRole('button', { name: 'Cerrar comprobante' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pagina de a 20 movimientos', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: '14 movimientos' });
    const { summary } = useWalletStore.getState();
    const extra = Array.from({ length: 10 }, (_, i) => ({
      id: `x${i}`, kind: 'payment', title: `Comercio ${i}`, detail: 'Pago con QR', amount: -10, status: 'completed', createdAt: '2026-09-01T10:00:00-03:00',
    }));
    useWalletStore.setState({ summary: { ...summary, recentMovements: [...summary.recentMovements, ...extra] } });
    expect(await screen.findByRole('heading', { name: '24 movimientos' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Ver comprobante/ })).toHaveLength(20);
    await user.click(screen.getByRole('button', { name: 'Ver más movimientos' }));
    expect(screen.getAllByRole('button', { name: /Ver comprobante/ })).toHaveLength(24);
  });
});
