import { ArrowDownLeft, ArrowUpRight, Plus, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';

const formatTime = value => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));

const kindIcons = {
  transferIn: ArrowDownLeft,
  transferOut: ArrowUpRight,
  payment: ShoppingBag,
  topUp: Plus,
};

const statusLabels = {
  completed: { text: 'Acreditado', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  pending: { text: 'Pendiente', className: 'bg-[#FFF4CC] text-[#8A6100] dark:bg-amber-950/40 dark:text-amber-300' },
};

const rowGrid = 'xl:grid xl:grid-cols-[minmax(0,1fr)_92px_124px_96px] xl:items-center xl:gap-3';

export default function RecentMovements({ movements, limit, onViewAll, title = 'Últimos movimientos', emptyMessage = 'Todavía no tenés movimientos.' }) {
  const visible = limit ? movements.slice(0, limit) : movements;

  return (
    <section aria-labelledby="movements-title" className="m-0 rounded-none border-0 bg-transparent p-0 shadow-none">
      <div className="mb-2 flex min-h-11 items-center justify-between">
        <h2 id="movements-title" className="m-0 text-base font-semibold text-[#1C1633] lg:text-lg dark:text-[#F4F2FA]">{title}</h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="m-0 h-11 rounded-full border-0 bg-transparent px-2 text-sm font-semibold text-[#4C1DB8] hover:underline dark:text-[#B9A6FF]"
          >
            Ver todos
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="m-0 rounded-[20px] bg-white p-5 text-sm text-[#8C87A3] dark:bg-[#140F24]">{emptyMessage}</p>
      ) : (
        <div className="rounded-[20px] bg-white px-4 lg:bg-transparent lg:px-0 dark:border dark:border-[#261E3D] dark:bg-[#140F24] lg:dark:border-0 lg:dark:bg-transparent">
          <div aria-hidden="true" className={`hidden rounded-xl bg-[#F3F1F9] px-4 py-2.5 text-xs font-semibold text-[#4A4560] dark:bg-[#1E1735] dark:text-[#9D97B5] ${rowGrid}`}>
            <span>Detalle</span>
            <span>Fecha</span>
            <span className="text-right">Monto</span>
            <span className="text-right">Estado</span>
          </div>
          <ul className="m-0 list-none divide-y divide-[#ECE9F5] p-0 dark:divide-[#261E3D]">
            {visible.map(movement => {
              const Icon = kindIcons[movement.kind] ?? ArrowUpRight;
              const isIncome = movement.amount > 0;
              const status = statusLabels[movement.status] ?? statusLabels.completed;
              return (
                <li key={movement.id} className={`flex items-center gap-3 py-3.5 xl:px-4 ${rowGrid}`}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-full xl:size-10 ${isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-[#F3F1F9] text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#B9A6FF]'}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 line-clamp-2 text-[15px] leading-snug font-medium text-[#1C1633] dark:text-[#F4F2FA]">{movement.title}</p>
                      <p className="m-0 text-xs text-[#8C87A3] dark:text-[#9D97B5]">
                        <span className="xl:hidden">
                          <time dateTime={movement.createdAt} className="font-mono">{formatDateTime(movement.createdAt)}</time>
                          {movement.status === 'pending' && <span className="ml-1.5 font-semibold text-[#8A6100] dark:text-amber-300">Pendiente</span>}
                        </span>
                        <span className="hidden xl:inline">{movement.detail}</span>
                      </p>
                    </div>
                  </div>
                  <time dateTime={movement.createdAt} className="hidden font-mono text-xs leading-relaxed text-[#4A4560] xl:block dark:text-[#9D97B5]">
                    {formatDate(movement.createdAt)}
                    <span className="block text-[#8C87A3] dark:text-[#6B6485]">{formatTime(movement.createdAt)}</span>
                  </time>
                  <span className={`shrink-0 text-right font-mono text-[15px] font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#1C1633] dark:text-[#F4F2FA]'}`}>
                    {isIncome ? '+' : '−'}{formatCurrency(Math.abs(movement.amount))}
                  </span>
                  <span className="hidden justify-end xl:flex">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
