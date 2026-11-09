import { TrendingDown, TrendingUp, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function SpendingBanner({ amount, budget, changePercent, onDismiss }) {
  const progress = Math.min(amount / budget, 1);
  const percent = Math.round(progress * 100);
  const circumference = 2 * Math.PI * 20;
  const spentLess = changePercent < 0;

  return (
    <section
      aria-labelledby="spending-title"
      className="relative m-0 overflow-hidden rounded-[22px] border border-[#ECE9F5] bg-gradient-to-br from-white via-[#F9F7FE] to-[#F1ECFC] p-5 pr-12 text-[#1C1633] shadow-[0_14px_30px_-22px_rgba(76,29,184,0.2)] dark:border-[#2C2247] dark:from-[#1B1430] dark:via-[#161028] dark:to-[#120D20] dark:text-[#F4F2FA] dark:shadow-none"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-12 size-40 rounded-full bg-[radial-gradient(circle,rgba(91,46,224,0.12)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(255,213,74,0.12)_0%,transparent_70%)]"
      />

      <div className="relative flex items-center gap-4">
        <div className="relative grid size-14 shrink-0 place-items-center">
          <svg viewBox="0 0 48 48" className="size-14 -rotate-90" aria-hidden="true">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              className="stroke-[#E5DFF6] dark:stroke-[#2A2044]"
              strokeWidth="5"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              className="stroke-[#5B2EE0] transition-all duration-300 dark:stroke-[#FFD54A]"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
            />
          </svg>
          <span
            aria-hidden="true"
            className="absolute font-mono text-[11px] font-bold text-[#4C1DB8] tabular-nums dark:text-[#FFD54A]"
          >
            {percent}%
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="spending-title"
              className="m-0 text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]"
            >
              Gastaste este mes
            </h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                spentLess
                  ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-400/12 dark:text-emerald-300 dark:ring-emerald-400/25'
                  : 'bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/20 dark:bg-rose-400/12 dark:text-rose-300 dark:ring-rose-400/25'
              }`}
            >
              {spentLess ? (
                <TrendingDown className="size-3" aria-hidden="true" />
              ) : (
                <TrendingUp className="size-3" aria-hidden="true" />
              )}
              {Math.abs(changePercent)}% {spentLess ? 'menos' : 'más'} que el mes pasado
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <p className="m-0 font-mono text-2xl leading-none font-bold tracking-[-0.02em] text-[#1C1633] tabular-nums dark:text-[#F4F2FA]">
              {formatCurrency(amount)}
            </p>
            <span className="font-mono text-xs text-[#6E6888] tabular-nums dark:text-[#9D97B5]">
              Tope: {formatCurrency(budget)}
            </span>
          </div>

          <div aria-hidden="true" className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E5DFF6] dark:bg-[#2A2044]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4C1DB8] to-[#7A4DFF] transition-all duration-300 dark:from-[#9B7BFF] dark:to-[#FFD54A]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar resumen de gastos"
        className="absolute top-3 right-3 m-0 grid size-8 place-items-center rounded-full border-0 bg-transparent p-0 text-[#8C87A3] transition-colors hover:bg-[#E9E5F6] hover:text-[#1C1633] dark:hover:bg-[#281F45] dark:hover:text-white"
      >
        <X className="size-4" />
      </button>
    </section>
  );
}
