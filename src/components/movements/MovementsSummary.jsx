import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function MovementsSummary({ totals }) {
  const isNetPositive = totals.net >= 0;
  const totalVolume = totals.income + totals.expense;
  const incomeRatio = totalVolume > 0 ? Math.round((totals.income / totalVolume) * 100) : 0;
  const expenseRatio = totalVolume > 0 ? 100 - incomeRatio : 0;

  return (
    <dl
      aria-label="Resumen del período filtrado"
      className="m-0 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr_1fr]"
    >
      <div className="relative flex flex-col justify-between overflow-hidden rounded-[26px] bg-gradient-to-br from-[#241054] via-[#1B0C3F] to-[#12072B] p-6 text-white shadow-[0_24px_48px_-20px_rgba(42,14,122,0.6)] dark:border dark:border-[#342657] dark:from-[#1D1338] dark:via-[#150E28] dark:to-[#0E091C] dark:shadow-[0_0_32px_rgba(91,46,224,0.2)]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-[radial-gradient(circle,rgba(255,213,74,0.24)_0%,transparent_70%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-[radial-gradient(circle,rgba(122,77,255,0.35)_0%,transparent_70%)]"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <dt className="text-xs font-semibold tracking-wider text-white/70 uppercase">
              Balance neto
            </dt>
            <p className="m-0 mt-0.5 text-[11px] text-white/50">
              Resultado entre entradas y salidas
            </p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FFD54A]/15 text-[#FFD54A] ring-1 ring-inset ring-[#FFD54A]/35">
            <Wallet className="size-5 stroke-[2.1]" aria-hidden="true" />
          </span>
        </div>

        <dd
          className={`relative m-0 my-4 truncate font-mono text-[28px] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[32px] ${
            isNetPositive ? 'text-[#FFD54A]' : 'text-rose-300'
          }`}
        >
          {`${isNetPositive ? '+' : '−'}${formatCurrency(Math.abs(totals.net))}`}
        </dd>

        <div className="relative">
          <div
            aria-hidden="true"
            className="flex h-2 w-full gap-1 overflow-hidden rounded-full bg-white/10 p-0.5"
          >
            <span
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${totalVolume > 0 ? Math.max(incomeRatio, 4) : 50}%` }}
            />
            <span
              className="h-full flex-1 rounded-full bg-[#9B7BFF] transition-all duration-300"
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
              {incomeRatio}% entradas
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[#9B7BFF]" />
              {expenseRatio}% salidas
            </span>
          </div>
        </div>
      </div>

      <div className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-emerald-500/20 bg-gradient-to-br from-white via-[#F6FCF9] to-[#EBF9F2] p-6 shadow-[0_18px_38px_-24px_rgba(16,185,129,0.28)] dark:border-emerald-500/20 dark:from-[#140F24] dark:via-[#111B22] dark:to-[#0C211C] dark:shadow-none">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.16)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(52,211,153,0.14)_0%,transparent_70%)]"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <dt className="text-xs font-semibold tracking-wider text-emerald-800/80 uppercase dark:text-emerald-300/80">
              Ingresos
            </dt>
            <p className="m-0 mt-0.5 text-[11px] text-[#6E6888] dark:text-[#9D97B5]">
              Transferencias y cargas
            </p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-[0_10px_20px_-8px_rgba(16,185,129,0.65)] ring-1 ring-inset ring-white/25 dark:bg-emerald-500/20 dark:text-emerald-300 dark:shadow-none dark:ring-emerald-400/30">
            <ArrowDownLeft className="size-5 stroke-[2.3]" aria-hidden="true" />
          </span>
        </div>

        <dd className="relative m-0 my-4 truncate font-mono text-[26px] leading-none font-bold tracking-[-0.03em] text-emerald-700 tabular-nums sm:text-[28px] dark:text-emerald-400">
          {`+${formatCurrency(totals.income)}`}
        </dd>

        <div className="relative">
          <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-950/8 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300 dark:bg-emerald-400"
              style={{ width: `${incomeRatio}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="font-medium text-[#5A5475] dark:text-[#9D97B5]">Total acreditado</span>
            <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 font-mono font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
              {incomeRatio}%
            </span>
          </div>
        </div>
      </div>

      <div className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-[#4C1DB8]/15 bg-gradient-to-br from-white via-[#F8F5FE] to-[#EFE9FC] p-6 shadow-[0_18px_38px_-24px_rgba(76,29,184,0.22)] dark:border-[#5B2EE0]/30 dark:from-[#140F24] dark:via-[#19122E] dark:to-[#22163F] dark:shadow-none">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-[radial-gradient(circle,rgba(91,46,224,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(155,123,255,0.16)_0%,transparent_70%)]"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <dt className="text-xs font-semibold tracking-wider text-[#4C1DB8] uppercase dark:text-[#C4B2FF]">
              Egresos
            </dt>
            <p className="m-0 mt-0.5 text-[11px] text-[#6E6888] dark:text-[#9D97B5]">
              Envíos y pagos con QR
            </p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#4C1DB8] text-white shadow-[0_10px_20px_-8px_rgba(76,29,184,0.65)] ring-1 ring-inset ring-white/20 dark:bg-[#5B2EE0]/25 dark:text-[#C4B2FF] dark:shadow-none dark:ring-[#9B7BFF]/35">
            <ArrowUpRight className="size-5 stroke-[2.3]" aria-hidden="true" />
          </span>
        </div>

        <dd className="relative m-0 my-4 truncate font-mono text-[26px] leading-none font-bold tracking-[-0.03em] text-[#1C1633] tabular-nums sm:text-[28px] dark:text-[#F4F2FA]">
          {`−${formatCurrency(totals.expense)}`}
        </dd>

        <div className="relative">
          <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-[#4C1DB8]/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[#4C1DB8] transition-all duration-300 dark:bg-[#9B7BFF]"
              style={{ width: `${expenseRatio}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="font-medium text-[#5A5475] dark:text-[#9D97B5]">Total debitado</span>
            <span className="rounded-full bg-[#4C1DB8]/10 px-2 py-0.5 font-mono font-semibold text-[#4C1DB8] dark:bg-[#5B2EE0]/25 dark:text-[#C4B2FF]">
              {expenseRatio}%
            </span>
          </div>
        </div>
      </div>
    </dl>
  );
}
