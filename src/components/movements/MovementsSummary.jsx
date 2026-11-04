import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function MovementsSummary({ totals }) {
  const tiles = [
    { label: 'Ingresos', value: `+${formatCurrency(totals.income)}`, icon: ArrowDownLeft, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { label: 'Egresos', value: `−${formatCurrency(totals.expense)}`, icon: ArrowUpRight, tone: 'bg-[#F3F1F9] text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#B9A6FF]' },
    {
      label: 'Balance neto',
      value: `${totals.net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(totals.net))}`,
      icon: Scale,
      tone: 'bg-[#FFF4CC] text-[#8A6100] dark:bg-amber-950/40 dark:text-amber-300',
    },
  ];
  return (
    <dl aria-label="Resumen del período filtrado" className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map(({ label, value, icon: Icon, tone }, index) => (
        <div
          key={label}
          className={`min-w-0 rounded-[20px] bg-white p-3.5 sm:p-4 shadow-[0_12px_32px_-24px_rgba(58,18,153,0.5)] dark:border dark:border-[#261E3D] dark:bg-[#140F24] dark:shadow-none ${index === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
        >
          <span className={`grid size-9 place-items-center rounded-full ${tone}`}>
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
          <dt className="mt-3 text-sm text-[#8C87A3] dark:text-[#9D97B5]">{label}</dt>
          <dd className="m-0 mt-0.5 truncate font-mono text-[15px] font-semibold sm:text-lg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
