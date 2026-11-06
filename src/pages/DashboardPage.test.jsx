import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage, { greetingFor } from './DashboardPage.jsx';
import { renderAt, resetWallet } from '@/test-utils';

beforeEach(resetWallet);

const renderDashboard = () => renderAt('/dashboard', <DashboardPage />);

describe('DashboardPage', () => {
  it('muestra la carga y después el saldo con formato', async () => {
    renderDashboard();
    expect(screen.getByLabelText('Cargando tu billetera')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Paulina Quintero');
    expect(screen.getByText(/152\.340,75/)).toBeInTheDocument();
  });

  it('oculta y muestra el saldo', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText(/152\.340,75/);
    await user.click(screen.getByRole('button', { name: 'Ocultar saldo' }));
    expect(screen.queryByText(/152\.340,75/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mostrar saldo' }));
    expect(screen.getByText(/152\.340,75/)).toBeInTheDocument();
  });

  it('las acciones rápidas llevan a su pantalla', async () => {
    const user = userEvent.setup();
    renderDashboard();
    const actions = await screen.findByRole('navigation', { name: 'Acciones rápidas' });
    await user.click(within(actions).getByRole('button', { name: 'Transferir' }));
    expect(screen.getByText('Otra pantalla')).toBeInTheDocument();
  });

  it('lista los últimos movimientos con ingresos, egresos y estado', async () => {
    renderDashboard();
    const section = (await screen.findByRole('heading', { name: 'Últimos movimientos' })).closest('section');
    const list = within(section).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(6);
    expect(within(list).getByText(/\+\$\s25\.000,00/)).toBeInTheDocument();
    expect(within(list).getByText(/−\$\s3\.850,00/)).toBeInTheDocument();
  });

  it('cierra el resumen de gastos', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Cerrar resumen de gastos' }));
    expect(screen.queryByText('Gastaste este mes')).not.toBeInTheDocument();
  });

  it('copia el CVU al portapapeles', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Copiar CVU' }));
    expect(writeText).toHaveBeenCalledWith('0000003100012345678901');
    expect(await screen.findByRole('button', { name: 'CVU copiado' })).toBeInTheDocument();
  });

  it('marca Inicio como la sección actual en el menú lateral', async () => {
    renderDashboard();
    const menu = await screen.findByRole('navigation', { name: 'Menú lateral' });
    expect(within(menu).getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('greetingFor', () => {
  it('saluda según la hora', () => {
    expect(greetingFor(new Date(2026, 9, 31, 9))).toBe('Buen día');
    expect(greetingFor(new Date(2026, 9, 31, 15))).toBe('Buenas tardes');
    expect(greetingFor(new Date(2026, 9, 31, 23))).toBe('Buenas noches');
  });
});
