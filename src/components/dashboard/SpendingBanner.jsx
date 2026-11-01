import { X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function SpendingBanner({ amount, budget, changePercent, onDismiss }) {
  const progress = Math.min(amount / budget, 1);
  const circumference = 2 * Math.PI * 18;
  const spentLess = changePercent < 0;

  return (
    <section aria-labelledby="spending-title" className="relative m-0 flex items-center gap-4 rounded-[20px] border-0 bg-[#F3F1F9] p-4 pr-12 text-[#1C1633] shadow-none dark:bg-[#1E1735] dark:text-[#F4F2FA]">
      <svg viewBox="0 0 44 44" className="size-12 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r="18" fill="none" className="stroke-[#E2DCF5] dark:stroke-[#281F45]" strokeWidth="6" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          className="stroke-[#5B2EE0] dark:stroke-[#9B7BFF]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <div className="min-w-0">
        <h2 id="spending-title" className="m-0 text-sm font-medium text-[#4A4560] dark:text-[#9D97B5]">Gastaste este mes</h2>
        <p className="mt-0.5 mb-0 font-mono text-xl font-semibold">{formatCurrency(amount)}</p>
        <p className={`mt-0.5 mb-0 text-xs ${spentLess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-300'}`}>
          {Math.abs(changePercent)}% {spentLess ? 'menos' : 'más'} que el mes pasado
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar resumen de gastos"
        className="absolute top-2 right-2 m-0 grid size-9 place-items-center rounded-full border-0 bg-transparent p-0 text-[#8C87A3] hover:bg-[#E9E5F6] hover:text-[#1C1633] dark:hover:bg-[#281F45] dark:hover:text-white"
      >
        <X className="size-4" />
      </button>
    </section>
  );
}
