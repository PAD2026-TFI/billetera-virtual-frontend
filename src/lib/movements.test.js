import { describe, expect, it } from 'vitest';
import { dayLabel, filterMovements, fromApiMovement, groupByDay, summarize } from './movements';

const now = new Date(2026, 10, 4, 12, 0);
const at = (day, hour = 10, month = 10) => new Date(2026, month, day, hour).toISOString();

const movements = [
  { id: 'a', kind: 'transferIn', title: 'Transferencia de Lucía', detail: 'Transferencia recibida', amount: 1000, status: 'completed', createdAt: at(4, 9) },
  { id: 'b', kind: 'payment', title: 'Café Martínez', detail: 'Pago con QR', amount: -250.5, status: 'completed', createdAt: at(3) },
  { id: 'c', kind: 'topUp', title: 'Carga de saldo', detail: 'Mercado Pago', amount: 500, status: 'pending', createdAt: at(1) },
  { id: 'd', kind: 'transferOut', title: 'Transferencia a Martín', detail: 'Transferencia enviada', amount: -300, status: 'completed', createdAt: at(20, 10, 9) },
];
const ids = list => list.map(m => m.id);

describe('filterMovements', () => {
  it('filtra por tipo', () => {
    expect(ids(filterMovements(movements, { type: 'income', now }))).toEqual(['a', 'c']);
    expect(ids(filterMovements(movements, { type: 'expense', now }))).toEqual(['b', 'd']);
    expect(ids(filterMovements(movements, { type: 'qr', now }))).toEqual(['b']);
  });

  it('filtra por período', () => {
    expect(ids(filterMovements(movements, { range: 'today', now }))).toEqual(['a']);
    expect(ids(filterMovements(movements, { range: 'week', now }))).toEqual(['a', 'b', 'c']);
    expect(ids(filterMovements(movements, { range: 'month', now }))).toEqual(['a', 'b', 'c']);
    expect(ids(filterMovements(movements, { range: 'custom', custom: { from: '2026-10-01', to: '2026-11-03' }, now }))).toEqual(['b', 'c', 'd']);
    expect(ids(filterMovements(movements, { range: 'custom', custom: { from: '', to: '' }, now }))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('busca por nombre, concepto o número de operación sin distinguir mayúsculas', () => {
    expect(ids(filterMovements(movements, { query: 'café', now }))).toEqual(['b']);
    expect(ids(filterMovements(movements, { query: 'MERCADO', now }))).toEqual(['c']);
    expect(ids(filterMovements(movements, { query: 'd', now })).includes('d')).toBe(true);
  });
});

describe('summarize', () => {
  it('suma solo lo acreditado y calcula el neto', () => {
    expect(summarize(movements)).toEqual({ income: 1000, expense: 550.5, net: 449.5 });
  });
});

describe('groupByDay', () => {
  it('agrupa por día con Hoy, Ayer y fecha larga', () => {
    const groups = groupByDay(movements, now);
    expect(groups.map(g => g.label)).toEqual(['Hoy', 'Ayer', '1 de noviembre de 2026', '20 de octubre de 2026']);
    expect(dayLabel(new Date(2026, 10, 3), now)).toBe('Ayer');
  });
});

describe('fromApiMovement', () => {
  it('adapta la respuesta del backend al modelo de la vista', () => {
    const debit = fromApiMovement({
      id: 'f1', type: 'Debit', amount: 1500.25, currency: 'ARS', balanceAfter: 8499.75, source: 'Transfer', sourceId: 't1', createdAt: '2026-11-01T10:00:00Z',
    });
    expect(debit).toMatchObject({ kind: 'transferOut', amount: -1500.25, balanceAfter: 8499.75, reference: 't1', status: 'completed' });
    expect(fromApiMovement({ id: 'f2', type: 'Credit', amount: 100, source: 'DevelopmentFunding', createdAt: '2026-11-01T10:00:00Z' }))
      .toMatchObject({ kind: 'topUp', amount: 100, title: 'Fondos de desarrollo' });
  });
});
