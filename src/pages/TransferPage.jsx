import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AtSign, Loader2, MessageSquareText, UserRound } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import { IconInput } from '@/components/auth/IconInput';
import Field from '@/components/forms/Field';
import MoneyInput from '@/components/forms/MoneyInput';
import ResultCard from '@/components/common/ResultCard';
import { alertClass, fieldInputClass, primaryActionClass, secondaryActionClass, sectionTitleClass } from '@/components/forms/formStyles';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { parseMoney } from '@/lib/money';
import { routes } from '@/lib/routes';
import { mockContacts, resolveRecipient, TRANSFER_LIMIT } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

const transferSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(1, 'Ingresá un alias o CVU.')
    .refine(value => /^\d{22}$/.test(value) || /^[a-zA-Z0-9.]{6,20}$/.test(value), 'El alias tiene de 6 a 20 caracteres y el CVU, 22 números.'),
  amount: z
    .string()
    .trim()
    .min(1, 'Ingresá cuánto querés transferir.')
    .refine(value => parseMoney(value) !== null, 'Usá solo números y hasta dos decimales, por ejemplo 1500,50.')
    .refine(value => (parseMoney(value) ?? 0) <= TRANSFER_LIMIT, `El máximo por transferencia es ${formatCurrency(TRANSFER_LIMIT)}.`),
  note: z.string().trim().max(60, 'Máximo 60 caracteres.').optional(),
});

function TransferForm({ balance, onReview }) {
  const { register, handleSubmit, setValue, setError, formState: { errors } } = useForm({
    resolver: zodResolver(transferSchema),
    mode: 'onTouched',
  });

  function submit(values) {
    const amount = parseMoney(values.amount);
    if (amount > balance) {
      setError('amount', { message: `Tu saldo disponible es ${formatCurrency(balance)}.` });
      return;
    }
    const recipient = resolveRecipient(values.destination);
    if (!recipient) {
      setError('destination', { message: 'No encontramos una cuenta con ese alias o CVU.' });
      return;
    }
    onReview({ destination: values.destination.trim(), amount, note: values.note, recipient });
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <form onSubmit={handleSubmit(submit)} noValidate className={`m-0 grid max-w-none gap-5 ${panelClass}`}>
        <h2 className={sectionTitleClass}>Datos de la transferencia</h2>
        <Field id="destination" label="Alias o CVU" error={errors.destination}>
          <IconInput icon={AtSign} id="destination" autoComplete="off" placeholder="nombre.apellido.padi" className={`${fieldInputClass} pl-11`} aria-invalid={!!errors.destination} {...register('destination')} />
        </Field>
        <Field id="amount" label="Monto" error={errors.amount} hint={`Disponible: ${formatCurrency(balance)}`}>
          <MoneyInput id="amount" aria-invalid={!!errors.amount} {...register('amount')} />
        </Field>
        <Field id="note" label="Motivo (opcional)" error={errors.note}>
          <IconInput icon={MessageSquareText} id="note" placeholder="Por ejemplo, alquiler" className={`${fieldInputClass} pl-11`} aria-invalid={!!errors.note} {...register('note')} />
        </Field>
        <button type="submit" className={`${primaryActionClass} mt-2`}>Continuar</button>
      </form>

      <section aria-labelledby="contacts-title" className={`m-0 grid gap-3 border-0 ${panelClass}`}>
        <h2 id="contacts-title" className={sectionTitleClass}>Contactos frecuentes</h2>
        <ul className="m-0 grid list-none gap-2 p-0">
          {Object.entries(mockContacts).map(([key, name]) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setValue('destination', key, { shouldValidate: true })}
                className="m-0 flex w-full items-center gap-3 rounded-2xl border-0 bg-[#F8F7FD] p-3 text-left hover:bg-[#F3F1F9] dark:bg-[#1E1735] dark:hover:bg-[#281F45]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E6DFFB] text-[#4C1DB8] dark:bg-[#281F45] dark:text-[#B9A6FF]">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#1C1633] dark:text-[#F4F2FA]">{name}</span>
                  <span className="block truncate font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">{key}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function TransferContent({ summary }) {
  const navigate = useNavigate();
  const transfer = useWalletStore(state => state.transfer);
  const [draft, setDraft] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setSending(true);
    setError('');
    try {
      setReceipt(await transfer(draft));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }

  if (receipt) {
    return (
      <div className={`mx-auto max-w-lg ${panelClass}`}>
        <ResultCard
          title="Transferencia enviada"
          amount={formatCurrency(-receipt.amount)}
          rows={[
            { label: 'Para', value: receipt.recipient },
            { label: 'Alias o CVU', value: receipt.destination, mono: true },
            { label: 'Fecha', value: formatDateTime(receipt.createdAt), mono: true },
            { label: 'Número de operación', value: receipt.id, mono: true },
          ]}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setReceipt(null); setDraft(null); }} className={secondaryActionClass}>Hacer otra</button>
            <button type="button" onClick={() => navigate(routes.home)} className={primaryActionClass}>Volver al inicio</button>
          </div>
        </ResultCard>
      </div>
    );
  }

  if (draft) {
    return (
      <div className={`mx-auto grid max-w-lg gap-6 ${panelClass}`}>
        <h2 className={sectionTitleClass}>Revisá antes de transferir</h2>
        <div className="rounded-2xl bg-[#F8F7FD] p-5 text-center dark:bg-[#1E1735]">
          <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">Vas a transferir</p>
          <p className="mt-1 mb-0 font-mono text-3xl font-semibold">{formatCurrency(draft.amount)}</p>
          <p className="mt-3 mb-0 text-sm">a <span className="font-semibold">{draft.recipient}</span></p>
          <p className="mt-0.5 mb-0 font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">{draft.destination}</p>
          {draft.note && <p className="mt-3 mb-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">Motivo: {draft.note}</p>}
        </div>
        {error && <p role="alert" className={alertClass}>{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setDraft(null)} disabled={sending} className={secondaryActionClass}>Modificar</button>
          <button type="button" onClick={confirm} disabled={sending} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
            {sending && <Loader2 className="size-4 animate-spin" />}
            {sending ? 'Transfiriendo…' : 'Transferir'}
          </button>
        </div>
      </div>
    );
  }

  return <TransferForm balance={summary.balance} onReview={setDraft} />;
}

export default function TransferPage() {
  return (
    <AppLayout header={() => <PageHeader title="Transferir" subtitle="Enviá dinero a otra cuenta con su alias o CVU." />}>
      {summary => <TransferContent summary={summary} />}
    </AppLayout>
  );
}
