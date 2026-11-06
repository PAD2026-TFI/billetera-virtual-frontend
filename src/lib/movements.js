
export const typeFilters = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'income', label: 'Ingresos', test: movement => movement.amount > 0 },
  { id: 'expense', label: 'Egresos', test: movement => movement.amount < 0 },
  { id: 'qr', label: 'Pagos QR', test: movement => movement.kind === 'payment' },
];

export const dateRanges = [
  { id: 'all', label: 'Todo el historial' },
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Últimos 7 días' },
  { id: 'month', label: 'Este mes' },
  { id: 'custom', label: 'Rango personalizado' },
];

const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const parseInputDate = value => {
  const [year, month, day] = (value ?? '').split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

export function rangeBounds(rangeId, now = new Date(), custom = {}) {
  const today = startOfDay(now);
  switch (rangeId) {
    case 'today':
      return { from: today, to: addDays(today, 1) };
    case 'week':
      return { from: addDays(today, -6), to: addDays(today, 1) };
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: addDays(today, 1) };
    case 'custom': {
      const from = parseInputDate(custom.from);
      const to = parseInputDate(custom.to);
      return { from, to: to ? addDays(to, 1) : null };
    }
    default:
      return { from: null, to: null };
  }
}

export function filterMovements(movements, { type = 'all', range = 'all', custom, query = '', now = new Date() } = {}) {
  const typeTest = (typeFilters.find(item => item.id === type) ?? typeFilters[0]).test;
  const { from, to } = rangeBounds(range, now, custom);
  const text = query.trim().toLowerCase();
  return movements.filter(movement => {
    const date = new Date(movement.createdAt);
    if (from && date < from) return false;
    if (to && date >= to) return false;
    if (!typeTest(movement)) return false;
    if (!text) return true;
    return [movement.title, movement.detail, movement.id, movement.reference].some(value => value?.toLowerCase().includes(text));
  });
}

export function summarize(movements) {
  let income = 0;
  let expense = 0;
  for (const movement of movements) {
    if (movement.status !== 'completed') continue;
    if (movement.amount > 0) income += movement.amount;
    else expense -= movement.amount;
  }
  const round = value => Math.round(value * 100) / 100;
  return { income: round(income), expense: round(expense), net: round(income - expense) };
}

const dayKey = date => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const longDate = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

export function dayLabel(date, now = new Date()) {
  const key = dayKey(date);
  if (key === dayKey(now)) return 'Hoy';
  if (key === dayKey(addDays(now, -1))) return 'Ayer';
  const text = longDate.format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function groupByDay(movements, now = new Date()) {
  const sorted = [...movements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const groups = [];
  for (const movement of sorted) {
    const date = new Date(movement.createdAt);
    const key = dayKey(date);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(movement);
    else groups.push({ key, label: dayLabel(date, now), items: [movement] });
  }
  return groups;
}

const sourceKinds = {
  Transfer: { Credit: 'transferIn', Debit: 'transferOut' },
  Payment: { Credit: 'topUp', Debit: 'payment' },
  DevelopmentFunding: { Credit: 'topUp', Debit: 'transferOut' },
};
const sourceTitles = {
  transferIn: ['Transferencia recibida', 'Transferencia inmediata'],
  transferOut: ['Transferencia enviada', 'Transferencia inmediata'],
  topUp: ['Carga de saldo', 'Mercado Pago'],
  payment: ['Pago', 'Pago con QR'],
};

export function fromApiMovement(dto) {
  const isCredit = dto.type === 'Credit';
  const kind = sourceKinds[dto.source]?.[dto.type] ?? (isCredit ? 'transferIn' : 'transferOut');
  const [title, detail] = dto.source === 'DevelopmentFunding' ? ['Fondos de desarrollo', 'Carga en sandbox'] : sourceTitles[kind];
  const amount = Number(dto.amount);
  return {
    id: dto.id,
    kind,
    title,
    detail,
    amount: isCredit ? amount : -amount,
    currency: dto.currency ?? 'ARS',
    status: 'completed',
    createdAt: dto.createdAt,
    balanceAfter: dto.balanceAfter === undefined ? undefined : Number(dto.balanceAfter),
    reference: dto.sourceId,
  };
}
