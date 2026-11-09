import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus, Receipt, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import MovementReceipt from '@/components/movements/MovementReceipt';
import { iconTone } from '@/components/movements/MovementRow';

const formatTime = value =>
  new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));

const kindIcons = {
  transferIn: ArrowDownLeft,
  transferOut: ArrowUpRight,
  payment: ShoppingBag,
  topUp: Plus,
};

const statusLabels = {
  completed: {
    text: 'Acreditado',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    className:
      'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/25',
  },
  pending: {
    text: 'Pendiente',
    dotClass: 'bg-amber-500 animate-pulse dark:bg-[#FFD54A]',
    className:
      'bg-[#FFF4CC] text-[#7A5400] ring-1 ring-inset ring-amber-400/40 dark:bg-amber-950/50 dark:text-[#FFD54A] dark:ring-amber-400/30',
  },
};

const rowGrid = 'xl:grid xl:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] xl:items-center xl:gap-3';

export default function RecentMovements({
  movements,
  limit,
  onViewAll,
  title = 'Últimos movimientos',
  emptyMessage = 'Todavía no tenés movimientos.',
}) {
  const [selected, setSelected] = useState(null);
  const visible = limit ? movements.slice(0, limit) : movements;

  return (
    <section aria-labelledby="movements-title" className="m-0 rounded-none border-0 bg-transparent p-0 shadow-none">
      <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 id="movements-title" className="m-0 text-base font-bold tracking-tight text-[#1C1633] lg:text-lg dark:text-[#F4F2FA]">
            {title}
          </h2>
          {visible.length > 0 && (
            <span
              aria-hidden="true"
              className="rounded-full bg-[#F3F1F9] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#FFD54A]"
            >
              {visible.length}
            </span>
          )}
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="group m-0 inline-flex h-9 items-center gap-1 rounded-full border-0 bg-[#F3F1F9] px-3.5 text-xs font-semibold text-[#4C1DB8] transition-colors hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#C4B2FF] dark:hover:bg-[#281F45]"
          >
            Ver todos
            <ChevronRight
              className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-[22px] border border-dashed border-[#DFD9F0] bg-white p-8 text-center dark:border-[#2C2247] dark:bg-[#140F24]">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#F3F1F9] text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#FFD54A]">
            <Receipt className="size-5" aria-hidden="true" />
          </span>
          <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-[#ECE9F5] bg-white p-1.5 lg:border-[#ECE9F5]/90 lg:bg-[#FCFBFD] dark:border-[#261E3D] dark:bg-[#140F24] lg:dark:bg-[#110C1F]/60">
          <div
            aria-hidden="true"
            className={`hidden border-b border-[#ECE9F5] px-4 py-2.5 text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:border-[#261E3D] dark:text-[#8C87A3] ${rowGrid}`}
          >
            <span>Operación</span>
            <span>Fecha</span>
            <span className="text-right">Monto</span>
            <span className="text-right">Estado</span>
          </div>

          <ul className="m-0 list-none divide-y divide-[#F1EEF9] p-0 dark:divide-[#201836]">
            {visible.map(movement => {
              const Icon = kindIcons[movement.kind] ?? ArrowUpRight;
              const isIncome = movement.amount > 0;
              const status = statusLabels[movement.status] ?? statusLabels.completed;

              return (
                <li key={movement.id} className="group/row">
                  <div
                    onClick={() => setSelected(movement)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(movement);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`relative flex cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-3.5 transition-all duration-150 hover:bg-[#F5F2FC] focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/40 focus-visible:outline-none xl:px-4 dark:hover:bg-[#1B1430] ${rowGrid}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute top-3 bottom-3 left-0 w-1 origin-center scale-y-0 rounded-r-full transition-transform duration-150 group-hover/row:scale-y-100 ${
                        isIncome ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-[#4C1DB8] dark:bg-[#FFD54A]'
                      }`}
                    />

                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl transition-transform duration-150 group-hover/row:scale-[1.03] xl:size-10 ${iconTone(
                          movement.kind,
                          isIncome
                        )}`}
                      >
                        <Icon className="size-5 stroke-[2.1]" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[15px] leading-snug font-semibold tracking-[-0.01em] text-[#1C1633] dark:text-[#F4F2FA]">
                          {movement.title}
                        </p>
                        <p className="m-0 mt-0.5 truncate text-xs text-[#6E6888] dark:text-[#9D97B5]">
                          <span className="xl:hidden">
                            <time dateTime={movement.createdAt} className="font-mono font-medium">
                              {formatDateTime(movement.createdAt)}
                            </time>
                            {movement.status === 'pending' && (
                              <span className="ml-1.5 inline-flex items-center gap-1 font-semibold text-[#7A5400] dark:text-[#FFD54A]">
                                <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500 dark:bg-[#FFD54A]" />
                                Pendiente
                              </span>
                            )}
                          </span>
                          <span className="hidden truncate xl:inline">{movement.detail}</span>
                        </p>
                      </div>
                    </div>

                    <time
                      dateTime={movement.createdAt}
                      className="hidden font-mono text-xs leading-tight font-medium text-[#4A4560] tabular-nums xl:block dark:text-[#B5AFCC]"
                    >
                      {formatDate(movement.createdAt)}
                      <span className="mt-0.5 block text-[11px] text-[#8C87A3] dark:text-[#6B6485]">
                        {formatTime(movement.createdAt)} hs
                      </span>
                    </time>

                    <span
                      className={`shrink-0 text-right font-mono text-[15px] font-bold tracking-tight tabular-nums sm:text-base ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#1C1633] dark:text-[#F4F2FA]'
                      }`}
                    >
                      {isIncome ? '+' : '−'}{formatCurrency(Math.abs(movement.amount))}
                    </span>

                    <span className="hidden justify-end xl:flex">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                        <span aria-hidden="true" className={`size-1.5 rounded-full ${status.dotClass}`} />
                        {status.text}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {selected && <MovementReceipt movement={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
