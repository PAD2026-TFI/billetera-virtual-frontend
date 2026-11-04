import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus, Store } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export const kindIcons = {
  transferIn: ArrowDownLeft,
  transferOut: ArrowUpRight,
  payment: Store,
  topUp: Plus,
};

export const statusLabels = {
  completed: { text: 'Completado', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  pending: { text: 'Pendiente', className: 'bg-[#FFF4CC] text-[#8A6100] dark:bg-amber-950/40 dark:text-amber-300' },
  failed: { text: 'Fallido', className: 'bg-red-50 text-red-700 dark:bg-rose-950/40 dark:text-rose-300' },
};

export const iconTone = isIncome =>
  isIncome
    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
    : 'bg-[#F3F1F9] text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#B9A6FF]';

export const signedAmount = amount => `${amount > 0 ? '+' : '−'}${formatCurrency(Math.abs(amount))}`;

const formatTime = value => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));

export default function MovementRow({ movement, onSelect }) {
  const Icon = kindIcons[movement.kind] ?? ArrowUpRight;
  const isIncome = movement.amount > 0;
  const status = statusLabels[movement.status] ?? statusLabels.completed;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(movement)}
        aria-label={`${movement.title}, ${signedAmount(movement.amount)}, ${status.text}. Ver comprobante`}
        className="m-0 flex w-full items-center gap-3 rounded-xl border-0 bg-transparent px-2 py-3 text-left font-[inherit] text-inherit shadow-none transition-colors hover:bg-[#F3F1F9] focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/40 focus-visible:outline-none sm:px-3 dark:hover:bg-[#1E1735]"
      >
        <span className={`grid size-11 shrink-0 place-items-center rounded-full ${iconTone(isIncome)}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[15px] leading-snug font-medium text-[#1C1633] dark:text-[#F4F2FA]">{movement.title}</span>
          <span className="block truncate text-xs text-[#8C87A3] dark:text-[#9D97B5]">
            <time dateTime={movement.createdAt} className="font-mono">{formatTime(movement.createdAt)}</time>
            {' · '}
            {movement.detail}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className={`font-mono text-[15px] font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#1C1633] dark:text-[#F4F2FA]'}`}>
            {signedAmount(movement.amount)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>{status.text}</span>
        </span>
        <ChevronRight className="hidden size-4 shrink-0 text-[#ABA6C2] sm:block" aria-hidden="true" />
      </button>
    </li>
  );
}
