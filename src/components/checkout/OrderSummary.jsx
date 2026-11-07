import { useEffect, useState } from 'react';
import { ShieldCheck, Store, Timer } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const VAT_RATE = 0.21;

function useRemainingSeconds(expiresAt, onExpire) {
  const secondsLeft = () => Math.max(0, Math.ceil((new Date(expiresAt) - Date.now()) / 1000));
  const [remaining, setRemaining] = useState(secondsLeft);

  useEffect(() => {
    if (remaining === 0) {
      onExpire();
      return undefined;
    }
    const timer = setTimeout(() => setRemaining(secondsLeft()), 1000);
    return () => clearTimeout(timer);
  });

  return remaining;
}

function Countdown({ expiresAt, onExpire }) {
  const remaining = useRemainingSeconds(expiresAt, onExpire);
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const urgent = remaining < 120;

  return (
    <p className={`m-0 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${urgent ? 'bg-red-50 text-red-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-[#FFF4CC] text-[#8A6100] dark:bg-amber-950/40 dark:text-amber-300'}`}>
      <Timer className="size-4 shrink-0" aria-hidden="true" />
      <span>
        Esta orden expira en <time className="font-mono font-semibold" dateTime={`PT${remaining}S`}>{minutes}:{seconds}</time> min
      </span>
    </p>
  );
}

export default function OrderSummary({ link, onExpire }) {
  const subtotal = Math.round((link.amount / (1 + VAT_RATE)) * 100) / 100;
  const rows = [
    { label: 'Subtotal', value: subtotal },
    { label: 'IVA (21 %)', value: Math.round((link.amount - subtotal) * 100) / 100 },
  ];

  return (
    <section aria-label="Detalle de la orden" className="grid gap-5">
      <header className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#1C1633] text-white dark:bg-[#281F45]">
          <Store className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="m-0 truncate text-lg font-semibold">{link.merchantName}</p>
          <p className="m-0 flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Pago seguro protegido por padi.
          </p>
        </div>
      </header>

      <div className="grid gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
        <div>
          <p className="m-0 font-semibold">{link.title}</p>
          {link.description && <p className="m-0 mt-0.5 text-sm text-[#8C87A3] dark:text-[#9D97B5]">{link.description}</p>}
        </div>
        <dl className="m-0 grid gap-1.5 border-t border-[#ECE9F5] pt-3 text-sm dark:border-[#261E3D]">
          {rows.map(row => (
            <div key={row.label} className="flex justify-between gap-4">
              <dt className="text-[#8C87A3] dark:text-[#9D97B5]">{row.label}</dt>
              <dd className="m-0 font-mono">{formatCurrency(row.value)}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 pt-1.5">
            <dt className="font-semibold">Total</dt>
            <dd className="m-0 font-mono text-2xl font-bold">{formatCurrency(link.amount)}</dd>
          </div>
        </dl>
      </div>

      {link.isPayable && <Countdown expiresAt={link.expiresAt} onExpire={onExpire} />}
    </section>
  );
}
