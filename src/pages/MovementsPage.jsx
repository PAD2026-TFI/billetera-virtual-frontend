import { useMemo, useState } from 'react';
import { CalendarDays, Receipt, RotateCcw, Search } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import { IconInput } from '@/components/auth/IconInput';
import CustomSelect from '@/components/ui/CustomSelect';
import { fieldInputClass, secondaryActionClass } from '@/components/forms/formStyles';
import MovementsList from '@/components/movements/MovementsList';
import MovementsSummary from '@/components/movements/MovementsSummary';
import MovementReceipt from '@/components/movements/MovementReceipt';
import { dateRanges, filterMovements, summarize, typeFilters } from '@/lib/movements';

export const PAGE_SIZE = 20;

const initialFilters = { type: 'all', range: 'all', custom: { from: '', to: '' }, query: '' };

const dateInputClass =
  'h-11 w-full rounded-xl border-0 bg-[#F3F1F9] px-3 font-mono text-sm text-[#1C1633] focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/40 focus-visible:outline-none dark:bg-[#1E1735] dark:text-[#F4F2FA] dark:[color-scheme:dark]';

function EmptyState({ onClear, hasFilters }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[24px] border border-dashed border-[#DFD9F0] bg-[#FAF9FE] px-6 py-12 text-center dark:border-[#2C2247] dark:bg-[#18122B]/60">
      <span className="grid size-14 place-items-center rounded-2xl bg-[#4C1DB8]/10 text-[#4C1DB8] ring-1 ring-inset ring-[#4C1DB8]/15 dark:bg-[#5B2EE0]/20 dark:text-[#FFD54A] dark:ring-[#5B2EE0]/35">
        <Receipt className="size-6 stroke-[2.1]" aria-hidden="true" />
      </span>
      <p className="m-0 text-base font-semibold text-[#1C1633] dark:text-[#F4F2FA]">
        {hasFilters ? 'No se encontraron movimientos para los filtros seleccionados' : 'Todavía no tenés movimientos'}
      </p>
      <p className="m-0 max-w-sm text-sm text-[#6E6888] dark:text-[#9D97B5]">
        {hasFilters
          ? 'Probá con otro período, otro tipo de operación o una búsqueda distinta.'
          : 'Cuando cargues saldo, transfieras o pagues, vas a ver cada operación acá.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className={`${secondaryActionClass} mt-2 inline-flex w-auto items-center gap-2`}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
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

      <div className={`grid grid-cols-[minmax(0,1fr)] gap-6 ${panelClass}`}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filtrar por tipo"
              className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#F3F1F9] p-1 dark:bg-[#1B1430]"
            >
              {typeFilters.map(item => {
                const active = filters.type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => update({ type: item.id })}
                    aria-pressed={active}
                    className={`m-0 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-0 px-4 text-xs font-semibold transition-all sm:text-sm ${
                      active
                        ? 'bg-[#4C1DB8] text-white shadow-[0_4px_12px_rgba(76,29,184,0.35)] dark:bg-[#5B2EE0] dark:shadow-[0_0_16px_rgba(91,46,224,0.4)]'
                        : 'bg-transparent text-[#4A4560] hover:text-[#1C1633] dark:text-[#9D97B5] dark:hover:text-white'
                    }`}
                  >
                    {active && <span aria-hidden="true" className="size-1.5 rounded-full bg-[#FFD54A]" />}
                    {item.label}
                  </button>
                );
              })}
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={() => update(initialFilters)}
                className="m-0 inline-flex h-9 items-center gap-1.5 rounded-full border-0 bg-[#F3F1F9] px-3.5 text-xs font-semibold text-[#4C1DB8] transition-colors hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#FFD54A] dark:hover:bg-[#281F45]"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Restablecer
              </button>
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[230px_minmax(0,1fr)] sm:items-center">
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-4 z-10 size-[18px] -translate-y-1/2 text-[#7E7699]"
                aria-hidden="true"
              />
              <label htmlFor="movement-range" className="sr-only">Período</label>
              <CustomSelect
                id="movement-range"
                value={filters.range}
                onChange={event => update({ range: event.target.value })}
                className="pl-11"
              >
                {dateRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.label}</option>
                ))}
              </CustomSelect>
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
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F8F6FC] p-3.5 sm:max-w-md dark:bg-[#1B1430]">
              <label className="grid gap-1 text-xs font-semibold text-[#4A4560] dark:text-[#9D97B5]">
                Desde
                <input
                  type="date"
                  value={filters.custom.from}
                  max={filters.custom.to || undefined}
                  onChange={event => update({ custom: { ...filters.custom, from: event.target.value } })}
                  className={dateInputClass}
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-[#4A4560] dark:text-[#9D97B5]">
                Hasta
                <input
                  type="date"
                  value={filters.custom.to}
                  min={filters.custom.from || undefined}
                  onChange={event => update({ custom: { ...filters.custom, to: event.target.value } })}
                  className={dateInputClass}
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 border-b border-[#ECE9F5] pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#261E3D]">
          <h2 className="m-0 text-base font-bold tracking-tight text-[#1C1633] lg:text-lg dark:text-[#F4F2FA]" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'movimiento' : 'movimientos'}
          </h2>
          <span className="text-xs text-[#8C87A3] dark:text-[#7E7699]">
            Tocá cualquier operación para ver su comprobante
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onClear={() => update(initialFilters)} hasFilters={hasFilters} />
        ) : (
          <>
            <MovementsList movements={page} onSelect={setSelected} now={now} />
            {filtered.length > page.length && (
              <button
                type="button"
                onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                className={`${secondaryActionClass} sm:mx-auto sm:w-auto`}
              >
                Ver más movimientos
              </button>
            )}
          </>
        )}
      </div>

      {selected && <MovementReceipt movement={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function MovementsPage() {
  return (
    <AppLayout header={() => <PageHeader title="Movimientos" subtitle="Consultá todos tus ingresos y egresos." />}>
      {summary => <MovementsContent movements={summary.recentMovements} />}
    </AppLayout>
  );
}
