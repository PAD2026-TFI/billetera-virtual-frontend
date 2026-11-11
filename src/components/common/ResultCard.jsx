import { CheckCircle2, Clock } from 'lucide-react';

export default function ResultCard({ tone = 'success', title, amount, rows = [], children }) {
  const isPending = tone === 'pending';
  const Icon = isPending ? Clock : CheckCircle2;

  return (
    <div role="status" className="grid gap-6 text-center">
      <span className={`mx-auto grid size-16 place-items-center rounded-full ${isPending ? 'bg-[#FFF4CC] text-[#8A6100] dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
        <Icon className={`size-8 ${isPending ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" />
      </span>
      <div>
        <h2 className="m-0 text-xl font-semibold text-[#1C1633] dark:text-[#F4F2FA]">{title}</h2>
        {amount && <p className="mt-2 mb-0 font-mono text-3xl font-semibold text-[#1C1633] dark:text-[#F4F2FA]">{amount}</p>}
      </div>
      {rows.length > 0 && (
        <dl className="m-0 divide-y divide-[#ECE9F5] rounded-2xl bg-[#F8F7FD] px-4 text-left dark:divide-[#261E3D] dark:bg-[#1E1735]">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-3">
              <dt className="shrink-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">{row.label}</dt>
              <dd className={`m-0 min-w-0 text-right text-sm font-medium text-[#1C1633] dark:text-[#F4F2FA] ${row.mono ? 'font-mono break-all' : 'break-words'}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </div>
  );
}
