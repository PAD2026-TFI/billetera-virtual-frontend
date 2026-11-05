import { useMemo, useState } from 'react';
import { CalendarDays, Receipt, Search } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import { IconInput } from '@/components/auth/IconInput';
import { fieldInputClass, secondaryActionClass } from '@/components/forms/formStyles';
import MovementsList from '@/components/movements/MovementsList';
import MovementsSummary from '@/components/movements/MovementsSummary';
import MovementReceipt from '@/components/movements/MovementReceipt';
import { dateRanges, filterMovements, summarize, typeFilters } from '@/lib/movements';

export const PAGE_SIZE = 20;

const initialFilters = { type: 'all', range: 'all', custom: { from: '', to: '' }, query: '' };

const selectClass =
  'h-11 w-full appearance-none rounded-xl border-0 bg-[#F3F1F9] pr-4 pl-11 text-sm text-[#1C1633] focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/35 focus-visible:outline-none dark:bg-[#1E1735] dark:text-[#F4F2FA]';
const dateInputClass =
  'h-11 w-full rounded-xl border-0 bg-[#F3F1F9] px-3 font-mono text-sm text-[#1C1633] focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/35 focus-visible:outline-none dark:bg-[#1E1735] dark:text-[#F4F2FA] dark:[color-scheme:dark]';

function EmptyState({ onClear, hasFilters }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[20px] bg-[#F8F7FD] px-6 py-10 text-center dark:bg-[#1E1735]/50">
      <span className="grid size-14 place-items-center rounded-full bg-[#F3F1F9] text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#B9A6FF]">
        <Receipt className="size-7" aria-hidden="true" />
      </span>
      <p className="m-0 font-semibold">
        {hasFilters ? 'No se encontraron movimientos para los filtros seleccionados' : 'Todavía no tenés movimientos'}
      </p>
      <p className="m-0 max-w-sm text-sm text-[#8C87A3] dark:text-[#9D97B5]">
        {hasFilters ? 'Probá con otro período, otro tipo de operación o una búsqueda distinta.' : 'Cuando cargues saldo, transfieras o pagues, vas a ver cada operación acá.'}
      </p>
      {hasFilters && (
        <button type="button" onClick={onClear} className={`${secondaryActionClass} mt-2 w-auto`}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

export function MovementsContent({ movements, now }) {
  const [filters, setFilters] = useState(initialFilters);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);

  const update = patch => {
    setFilters(current => ({ ...current, ...patch }));
    setVisibleCount(PAGE_SIZE);
  };

  const filtered = useMemo(() => filterMovements(movements, { ...filters, now }), [movements, filters, now]);
  const totals = useMemo(() => summarize(filtered), [filtered]);
  const page = filtered.slice(0, visibleCount);
  const hasFilters = filters.type !== 'all' || filters.range !== 'all' || filters.query.trim() !== '';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-7">
      <MovementsSummary totals={totals} />

      <div className={`grid grid-cols-[minmax(0,1fr)] gap-5 ${panelClass}`}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
            <div role="group" aria-label="Filtrar por tipo" className="flex gap-2 overflow-x-auto pb-1 sm:col-span-2">
              {typeFilters.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update({ type: item.id })}
                  aria-pressed={filters.type === item.id}
                  className={`m-0 h-10 shrink-0 rounded-full border-0 px-4 text-sm font-semibold transition-colors ${filters.type === item.id ? 'bg-[#4C1DB8] text-white dark:bg-[#5B2EE0]' : 'bg-[#F3F1F9] text-[#4A4560] hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#9D97B5]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#9C96B5]" aria-hidden="true" />
              <label htmlFor="movement-range" className="sr-only">Período</label>
              <select id="movement-range" value={filters.range} onChange={event => update({ range: event.target.value })} className={selectClass}>
                {dateRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="movement-search" className="sr-only">Buscar movimientos</label>
              <IconInput
                icon={Search}
                id="movement-search"
                type="search"
                value={filters.query}
                onChange={event => update({ query: event.target.value })}
                placeholder="Nombre, concepto o n.º de operación"
                className={`${fieldInputClass} h-11 pl-11`}
              />
            </div>
          </div>

          {filters.range === 'custom' && (
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <label className="grid gap-1 text-xs font-medium text-[#4A4560] dark:text-[#9D97B5]">
                Desde
                <input type="date" value={filters.custom.from} max={filters.custom.to || undefined} onChange={event => update({ custom: { ...filters.custom, from: event.target.value } })} className={dateInputClass} />
              </label>
              <label className="grid gap-1 text-xs font-medium text-[#4A4560] dark:text-[#9D97B5]">
                Hasta
                <input type="date" value={filters.custom.to} min={filters.custom.from || undefined} onChange={event => update({ custom: { ...filters.custom, to: event.target.value } })} className={dateInputClass} />
              </label>
            </div>
          )}
        </div>

        <h2 className="m-0 text-base font-semibold lg:text-lg" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'movimiento' : 'movimientos'}
        </h2>

        {filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={() => update(initialFilters)} />
        ) : (
          <>
            <MovementsList movements={page} onSelect={setSelected} now={now} />
            {filtered.length > page.length && (
              <button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)} className={`${secondaryActionClass} sm:mx-auto sm:w-auto`}>
                Ver más movimientos
              </button>
            )}
          </>
        )}
      </div>

      <MovementReceipt movement={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function MovementsPage() {
  return (
    <AppLayout header={() => <PageHeader title="Movimientos" subtitle="Todo lo que entró y salió de tu cuenta." />}>
      {summary => <MovementsContent movements={summary.recentMovements} />}
    </AppLayout>
  );
}
