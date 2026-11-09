import { ArrowUpRight, Loader2, ShieldCheck } from 'lucide-react';
import { alertClass, primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
import { formatCurrency } from '@/lib/formatters';
import RecipientCard from './RecipientCard';

export default function ReviewStep({
  holder,
  account,
  recipient,
  draft,
  sending,
  error,
  onBack,
  onConfirm,
}) {
  const rows = [
    { label: 'Desde', value: `${holder.firstName} ${holder.lastName}` },
    { label: 'Tu alias', value: account.alias, mono: true },
    { label: 'Motivo', value: draft.reason },
    { label: 'Comisión', value: formatCurrency(0), mono: true },
    { label: 'Acreditación', value: 'Inmediata', highlight: true },
  ];

  return (
    <div className="m-0 flex min-h-0 flex-1 flex-col justify-between gap-3.5 border-0 bg-transparent p-0 animate-page-enter">
      <div className="grid gap-3">
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#231052] via-[#170A38] to-[#0D0620] p-4 text-white shadow-[0_18px_36px_-18px_rgba(37,16,87,0.75)] ring-1 ring-inset ring-white/15">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-14 -right-12 size-40 rounded-full bg-[radial-gradient(circle,rgba(255,213,74,0.22)_0%,transparent_70%)]"
          />

          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-semibold tracking-wider text-white/70 uppercase">
                Vas a transferir
              </p>
              <p className="mt-1 mb-0 font-mono text-[26px] leading-none font-bold tracking-[-0.03em] text-[#FFD54A] tabular-nums sm:text-[28px]">
                {formatCurrency(draft.amount)}
              </p>
            </div>
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#FFD54A]/15 text-[#FFD54A] ring-1 ring-inset ring-[#FFD54A]/35"
            >
              <ArrowUpRight className="size-5 stroke-[2.3]" />
            </span>
          </div>
        </div>

        <RecipientCard recipient={recipient} />

        <dl className="m-0 divide-y divide-[#ECE9F5] rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] px-4 text-xs dark:divide-[#251C3D] dark:border-[#261E3D] dark:bg-[#19122C]">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-[11px] text-[#6E6888] dark:text-[#9D97B5]">{row.label}</dt>
              <dd
                className={`m-0 text-right text-xs font-semibold ${
                  row.highlight
                    ? 'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300'
                    : 'text-[#1C1633] dark:text-[#F4F2FA]'
                } ${row.mono ? 'font-mono' : ''}`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center gap-2 rounded-xl border border-[#4C1DB8]/15 bg-[#EDE7FC]/60 px-3.5 py-2 text-[11px] font-medium text-[#4C1DB8] dark:border-[#5B2EE0]/30 dark:bg-[#241B3E]/70 dark:text-[#C4B2FF]">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Operación protegida con token único y cifrado de extremo a extremo.</span>
        </div>

        {error && <p role="alert" className={alertClass}>{error}</p>}
      </div>

      <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={sending}
          className={secondaryActionClass}
        >
          Modificar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={sending}
          className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}
        >
          {sending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {sending ? 'Transfiriendo…' : 'Confirmar transferencia'}
        </button>
      </div>
    </div>
  );
}
