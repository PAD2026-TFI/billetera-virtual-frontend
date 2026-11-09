import { Eye, EyeOff, Wifi } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function WalletCard({ holderName, balance, lastDigits, expiry, hidden, onToggleHidden }) {
  return (
    <section
      aria-labelledby="wallet-card-title"
      className="relative m-0 rounded-none border-0 bg-transparent p-0 pt-5 shadow-none"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-7 top-0 h-20 rounded-t-[24px] bg-gradient-to-r from-[#FFD54A] via-[#FFE580] to-[#F2B626] opacity-95 shadow-sm"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-3.5 top-2.5 h-20 rounded-t-[26px] bg-gradient-to-r from-[#5B2EE0] via-[#6E42F5] to-[#4C1DB8]"
      />

      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#251057] via-[#170A38] to-[#0D0620] p-6 text-white shadow-[0_26px_50px_-20px_rgba(37,16,87,0.85)] ring-1 ring-inset ring-white/15 dark:shadow-[0_0_38px_rgba(91,46,224,0.32)]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(255,213,74,0.22)_0%,transparent_68%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(122,77,255,0.4)_0%,transparent_70%)]"
        />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-end text-lg leading-none font-bold tracking-[-0.05em] text-white">
                padi
                <span aria-hidden="true" className="mb-[0.1em] ml-[0.07em] size-1.5 rounded-full bg-[#FFD54A]" />
              </span>
              <span aria-hidden="true" className="h-3.5 w-px bg-white/20" />
              <h2 id="wallet-card-title" className="m-0 text-xs font-semibold tracking-wide text-white/75 uppercase">
                Cuenta padi
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#FFD54A] ring-1 ring-inset ring-white/12">
                ARS
              </span>
              <Wifi className="size-4 rotate-90 text-white/75" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/70">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
                Saldo disponible
              </p>
              <p
                className="mt-1.5 mb-0 truncate font-mono text-[32px] leading-none font-bold tracking-[-0.03em] text-white tabular-nums sm:text-[36px]"
                aria-live="polite"
              >
                {hidden ? '$ ••••••' : formatCurrency(balance)}
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleHidden}
              aria-label={hidden ? 'Mostrar saldo' : 'Ocultar saldo'}
              aria-pressed={hidden}
              className="m-0 grid size-11 shrink-0 place-items-center rounded-2xl border-0 bg-white/12 p-0 text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20"
            >
              {hidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          <div className="mt-6 border-t border-white/12 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="relative grid h-7 w-9 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-[#FFE885] via-[#FFD54A] to-[#C89214] shadow-inner ring-1 ring-white/30"
                >
                  <span className="h-3.5 w-5 rounded-[2px] border border-[#7A5400]/35" />
                </span>
                <p
                  className="m-0 font-mono text-sm font-medium tracking-[0.18em] text-white/90"
                  aria-label={`Tarjeta terminada en ${lastDigits}`}
                >
                  •••• •••• •••• {lastDigits}
                </p>
              </div>

              <span aria-hidden="true" className=" inline-flex items-center">
                <span className="size-5 rounded-full bg-[#EB001B]/85" />
                <span className="-ml-2 size-5 rounded-full bg-[#F79E1B]/85 mix-blend-screen" />
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-white/75">
              <span className="truncate font-medium tracking-wide text-white/90">{holderName}</span>
              <span className="font-mono text-white/80" aria-label={`Vence ${expiry}`}>
                VTO {expiry}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
