import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus, Store } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export const kindIcons = {
  transferIn: ArrowDownLeft,
  transferOut: ArrowUpRight,
  payment: Store,
  topUp: Plus,
};

export const kindMeta = {
  transferIn: {
    label: 'Ingreso',
    tone: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25',
  },
  topUp: {
    label: 'Carga',
    tone: 'bg-[#FFD54A]/25 text-[#7A5400] ring-1 ring-inset ring-[#E5B822]/40 dark:bg-[#FFD54A]/15 dark:text-[#FFD54A] dark:ring-[#FFD54A]/30',
  },
  payment: {
    label: 'Pago QR',
    tone: 'bg-[#4C1DB8]/8 text-[#4C1DB8] ring-1 ring-inset ring-[#4C1DB8]/15 dark:bg-[#5B2EE0]/20 dark:text-[#C4B2FF] dark:ring-[#5B2EE0]/35',
  },
  transferOut: {
    label: 'Envío',
    tone: 'bg-[#1C1633]/6 text-[#1C1633] ring-1 ring-inset ring-[#1C1633]/12 dark:bg-white/8 dark:text-[#E2DCF5] dark:ring-white/15',
  },
};

export const statusLabels = {
  completed: {
    text: 'Completado',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    className: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/25',
  },
  pending: {
    text: 'Pendiente',
    dotClass: 'bg-amber-500 animate-pulse dark:bg-[#FFD54A]',
    className: 'bg-[#FFF4CC] text-[#7A5400] ring-1 ring-inset ring-amber-400/40 dark:bg-amber-950/50 dark:text-[#FFD54A] dark:ring-amber-400/30',
  },
  failed: {
    text: 'Fallido',
    dotClass: 'bg-rose-500 dark:bg-rose-400',
    className: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-500/20 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-500/25',
  },
};

export const iconTone = (kindOrIncome, isIncomeFallback = false) => {
  if (typeof kindOrIncome === 'string' && kindMeta[kindOrIncome]) {
    return kindMeta[kindOrIncome].tone;
  }
  const isIncome = typeof kindOrIncome === 'boolean' ? kindOrIncome : isIncomeFallback;
  return isIncome ? kindMeta.transferIn.tone : kindMeta.payment.tone;
};

export const signedAmount = amount => `${amount > 0 ? '+' : '−'}${formatCurrency(Math.abs(amount))}`;

const formatTime = value => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));

export default function MovementRow({ movement, onSelect }) {
  const Icon = kindIcons[movement.kind] ?? ArrowUpRight;
  const isIncome = movement.amount > 0;
  const status = statusLabels[movement.status] ?? statusLabels.completed;

  return (
    <li className="group/row">
      <button
        type="button"
        onClick={() => onSelect(movement)}
        aria-label={`${movement.title}, ${signedAmount(movement.amount)}, ${status.text}. Ver comprobante`}
        className="relative m-0 flex w-full items-center gap-3.5 rounded-2xl border-0 bg-transparent px-3 py-3.5 text-left font-[inherit] text-inherit shadow-none transition-all duration-150 hover:bg-[#F5F2FC] focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/40 focus-visible:outline-none sm:px-4 dark:hover:bg-[#1B1430]"
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-3 bottom-3 left-0 w-1 origin-center scale-y-0 rounded-r-full transition-transform duration-150 group-hover/row:scale-y-100 ${
            isIncome ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-[#4C1DB8] dark:bg-[#FFD54A]'
          }`}
        />

        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl transition-transform duration-150 group-hover/row:scale-[1.03] ${iconTone(movement.kind, isIncome)}`}>
          <Icon className="size-5 stroke-[2.1]" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="line-clamp-1 text-[15px] leading-snug font-semibold tracking-[-0.01em] text-[#1C1633] dark:text-[#F4F2FA]">
            {movement.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[#6E6888] dark:text-[#9D97B5]">
            <time dateTime={movement.createdAt} className="font-mono font-medium text-[#4A4560] dark:text-[#B5AFCC]">
              {formatTime(movement.createdAt)}
            </time>
            <span aria-hidden="true" className="size-1 rounded-full bg-[#CBC5DF] dark:bg-[#3D335A]" />
            <span className="truncate">{movement.detail}</span>
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`font-mono text-[15px] font-bold tracking-tight tabular-nums sm:text-base ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#1C1633] dark:text-[#F4F2FA]'
            }`}
          >
            {signedAmount(movement.amount)}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${status.dotClass}`} />
            {status.text}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="hidden size-7 shrink-0 place-items-center rounded-full bg-transparent text-[#ABA6C2] transition-all duration-150 group-hover/row:translate-x-0.5 group-hover/row:bg-[#ECE7FA] group-hover/row:text-[#4C1DB8] sm:grid dark:group-hover/row:bg-[#261E3D] dark:group-hover/row:text-[#FFD54A]"
        >
          <ChevronRight className="size-4" />
        </span>
      </button>
    </li>
  );
}
