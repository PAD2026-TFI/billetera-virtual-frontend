import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import RecentMovements from '@/components/dashboard/RecentMovements';
import { IconInput } from '@/components/auth/IconInput';
import { fieldInputClass } from '@/components/forms/formStyles';
import { formatCurrency } from '@/lib/formatters';

const filters = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'income', label: 'Ingresos', test: movement => movement.amount > 0 },
  { id: 'expense', label: 'Egresos', test: movement => movement.amount < 0 },
  { id: 'pending', label: 'Pendientes', test: movement => movement.status === 'pending' },
];

function Totals({ movements }) {
  const income = movements.filter(m => m.amount > 0 && m.status === 'completed').reduce((sum, m) => sum + m.amount, 0);
  const expense = movements.filter(m => m.amount < 0).reduce((sum, m) => sum - m.amount, 0);
  const tiles = [
    { label: 'Entró', value: income, icon: ArrowDownLeft, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { label: 'Salió', value: expense, icon: ArrowUpRight, tone: 'bg-[#F3F1F9] text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#B9A6FF]' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="rounded-[20px] bg-white p-4 shadow-[0_12px_32px_-24px_rgba(58,18,153,0.5)] dark:border dark:border-[#261E3D] dark:bg-[#140F24] dark:shadow-none">
          <span className={`grid size-9 place-items-center rounded-full ${tone}`}>
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
          <p className="mt-3 mb-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">{label}</p>
          <p className="mt-0.5 mb-0 font-mono text-lg font-semibold">{formatCurrency(value)}</p>
        </div>
      ))}
    </div>
  );
}

function MovementsContent({ summary }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const active = filters.find(item => item.id === filter);
    const text = query.trim().toLowerCase();
    return summary.recentMovements.filter(
      movement => active.test(movement) && (!text || `${movement.title} ${movement.detail}`.toLowerCase().includes(text)),
    );
  }, [summary.recentMovements, filter, query]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-7">
      <Totals movements={summary.recentMovements} />
      <div className={`grid gap-5 ${panelClass}`}>
        <div className="grid gap-3 lg:grid-cols-[1fr_280px] lg:items-center">
          <div role="group" aria-label="Filtrar movimientos" className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={`m-0 h-10 shrink-0 rounded-full border-0 px-4 text-sm font-semibold transition-colors ${filter === item.id ? 'bg-[#4C1DB8] text-white dark:bg-[#5B2EE0]' : 'bg-[#F3F1F9] text-[#4A4560] hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#9D97B5]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label htmlFor="movement-search" className="sr-only">Buscar movimientos</label>
          <IconInput
            icon={Search}
            id="movement-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar por nombre o detalle"
            className={`${fieldInputClass} h-11 pl-11`}
          />
        </div>
        <RecentMovements
          movements={visible}
          title={`${visible.length} ${visible.length === 1 ? 'movimiento' : 'movimientos'}`}
          emptyMessage="No hay movimientos que coincidan con tu búsqueda."
        />
      </div>
    </div>
  );
}

export default function MovementsPage() {
  return (
    <AppLayout header={() => <PageHeader title="Movimientos" subtitle="Todo lo que entró y salió de tu cuenta." />}>
      {summary => <MovementsContent summary={summary} />}
    </AppLayout>
  );
}
