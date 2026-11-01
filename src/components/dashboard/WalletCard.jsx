import { Eye, EyeOff, Wifi } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function WalletCard({ holderName, balance, lastDigits, expiry, hidden, onToggleHidden }) {
  return (
    <section aria-labelledby="wallet-card-title" className="relative m-0 rounded-none border-0 bg-transparent p-0 pt-5 shadow-none">
      <div aria-hidden="true" className="absolute inset-x-8 top-0 h-24 rounded-[24px] bg-[#3A1299]" />
      <div aria-hidden="true" className="absolute inset-x-4 top-2.5 h-24 rounded-[24px] bg-[#4C1DB8]" />

      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#7A4DFF] to-[#5B2EE0] p-6 text-white shadow-[0_22px_40px_-20px_rgba(58,18,153,0.75)] dark:shadow-[0_0_30px_rgba(91,46,224,0.3)]">
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 -right-16 size-72 -translate-y-1/2 rounded-full bg-[#4C1DB8]/60" />

        <div className="relative">
          <div className="flex items-start justify-between">
            <h2 id="wallet-card-title" className="m-0 text-[15px] font-semibold">Cuenta padi</h2>
            <Wifi className="size-5 rotate-90 text-white/80" aria-hidden="true" />
          </div>

          <div className="mt-6 flex items-end justify-between gap-3">
            <div>
              <p className="m-0 text-sm text-white/80">Saldo disponible</p>
              <p className="mt-1 mb-0 font-mono text-[32px] leading-none font-semibold tracking-tight" aria-live="polite">
                {hidden ? '$ ••••••' : formatCurrency(balance)}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleHidden}
              aria-label={hidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              aria-pressed={hidden}
              className="m-0 grid size-11 shrink-0 place-items-center rounded-full border-0 bg-white/15 p-0 text-white hover:bg-white/25"
            >
              {hidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          <p className="mt-8 mb-0 font-mono text-base tracking-[0.18em]" aria-label={`Tarjeta terminada en ${lastDigits}`}>
            •••• •••• •••• {lastDigits}
          </p>
          <div className="mt-2 flex items-end justify-between text-sm text-white/85">
            <span>{holderName}</span>
            <span className="font-mono" aria-label={`Vence ${expiry}`}>{expiry}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
