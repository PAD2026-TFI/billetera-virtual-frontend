import { Loader2 } from 'lucide-react';
import { alertClass, primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
import { formatCurrency } from '@/lib/formatters';
import RecipientCard from './RecipientCard';

export default function ReviewStep({ holder, account, recipient, draft, sending, error, onBack, onConfirm }) {
  const rows = [
    { label: 'Desde', value: `${holder.firstName} ${holder.lastName}` },
    { label: 'Tu alias', value: account.alias, mono: true },
    { label: 'Motivo', value: draft.reason },
    { label: 'Comisión', value: formatCurrency(0), mono: true },
    { label: 'Acreditación', value: 'Inmediata' },
  ];

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl bg-[#F8F7FD] p-5 text-center dark:bg-[#1E1735]">
        <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">Vas a transferir</p>
        <p className="mt-1 mb-0 font-mono text-3xl font-semibold">{formatCurrency(draft.amount)}</p>
      </div>

      <RecipientCard recipient={recipient} />

      <dl className="m-0 grid gap-2 text-sm">
        {rows.map(row => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-[#8C87A3] dark:text-[#9D97B5]">{row.label}</dt>
            <dd className={`m-0 text-right font-medium ${row.mono ? 'font-mono' : ''}`}>{row.value}</dd>
          </div>
        ))}
      </dl>

      {error && <p role="alert" className={alertClass}>{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onBack} disabled={sending} className={secondaryActionClass}>Modificar</button>
        <button type="button" onClick={onConfirm} disabled={sending} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
          {sending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {sending ? 'Transfiriendo…' : 'Confirmar transferencia'}
        </button>
      </div>
    </div>
  );
}
