import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, Store, Timer, Zap } from 'lucide-react';
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
    <div
      className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
        urgent
          ? 'border border-red-200 bg-red-50 text-red-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
          : 'border border-amber-200 bg-[#FFF4CC] text-[#8A6100] dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
      }`}
    >
      <Timer className={`size-4.5 shrink-0 ${urgent ? 'animate-pulse text-red-600 dark:text-rose-400' : 'text-[#8A6100] dark:text-amber-400'}`} aria-hidden="true" />
      <span>
        Esta orden expira en <time className="font-mono font-bold" dateTime={`PT${remaining}S`}>{minutes}:{seconds}</time> min
      </span>
    </div>
  );
}

export default function OrderSummary({ link, onExpire }) {
  const subtotal = Math.round((link.amount / (1 + VAT_RATE)) * 100) / 100;
  const rows = [
    { label: 'Subtotal', value: subtotal },
    { label: 'IVA (21 %)', value: Math.round((link.amount - subtotal) * 100) / 100 },
  ];

  return (
    <section aria-label="Detalle de la orden" className="flex h-full flex-col justify-between gap-6">
      <div className="grid gap-6">
        <header className="flex items-center gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#4C1DB8] to-[#6C3BF4] text-[#FFD54A] shadow-md shadow-violet-500/20">
            <Store className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-lg font-bold text-[#1C1633] dark:text-[#F4F2FA]">{link.merchantName}</p>
            <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
              Pago seguro protegido por padi.
            </p>
          </div>
        </header>

        <div className="grid gap-4 rounded-2xl border border-[#ECE9F5] bg-[#F8F7FD] p-5 dark:border-[#261E3D] dark:bg-[#1E1735]/60">
          <div>
            <p className="m-0 text-base font-semibold text-[#1C1633] dark:text-[#F4F2FA]">{link.title}</p>
            {link.description && (
              <p className="m-0 mt-1 text-sm text-[#4A4560] dark:text-[#9D97B5]">{link.description}</p>
            )}
          </div>
          <dl className="m-0 grid gap-2.5 border-t border-[#ECE9F5] pt-4 text-sm dark:border-[#261E3D]">
            {rows.map(row => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-[#8C87A3] dark:text-[#9D97B5]">{row.label}</dt>
                <dd className="m-0 font-mono font-medium text-[#1C1633] dark:text-[#F4F2FA]">{formatCurrency(row.value)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t border-[#ECE9F5] pt-3.5 dark:border-[#261E3D]">
              <dt className="text-base font-bold text-[#1C1633] dark:text-[#F4F2FA]">Total</dt>
              <dd className="m-0 font-mono text-3xl font-extrabold tracking-tight text-[#4C1DB8] dark:text-[#FFD54A]">
                {formatCurrency(link.amount)}
              </dd>
            </div>
          </dl>
        </div>

        {link.isPayable && <Countdown expiresAt={link.expiresAt} onExpire={onExpire} />}
      </div>

      <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-[#ECE9F5]/80 bg-[#F3F1F9]/50 p-4 text-xs text-[#4A4560] dark:border-[#261E3D]/80 dark:bg-[#1E1735]/30 dark:text-[#9D97B5]">
        <div className="flex items-center gap-2">
          <Lock className="size-3.5 shrink-0 text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
          <span>Cifrado TLS 1.3 de extremo a extremo</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="size-3.5 shrink-0 text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
          <span>Acreditación instantánea en la cuenta del comercio</span>
        </div>
      </div>
    </section>
  );
}
