import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import ResultCard from '@/components/common/ResultCard';
import { primaryActionClass, secondaryActionClass, sectionTitleClass } from '@/components/forms/formStyles';
import TransferStepper from '@/components/transfer/TransferStepper';
import RecipientStep from '@/components/transfer/RecipientStep';
import AmountStep from '@/components/transfer/AmountStep';
import ReviewStep from '@/components/transfer/ReviewStep';
import { formatCuit, formatCurrency, formatDateTime } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { TRANSFER_LIMIT } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

const stepTitles = ['¿A quién le transferís?', '¿Cuánto querés transferir?', 'Revisá antes de confirmar', 'Transferencia enviada'];

function TransferContent({ summary }) {
  const navigate = useNavigate();
  const transfer = useWalletStore(state => state.transfer);
  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState(null);
  const [draft, setDraft] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  function review(values) {
    setDraft(values);
    setIdempotencyKey(crypto.randomUUID());
    setError('');
    setStep(2);
  }

  async function confirm() {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      setReceipt(await transfer({ destination: recipient.destination, ...draft, idempotencyKey }));
      setStep(3);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }

  function restart() {
    setStep(0);
    setRecipient(null);
    setDraft(null);
    setReceipt(null);
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <section aria-label="Transferencia" className={`m-0 grid gap-6 ${panelClass}`}>
        <TransferStepper current={step} />
        {step < 3 && <h2 className={sectionTitleClass}>{stepTitles[step]}</h2>}

        {step === 0 && <RecipientStep account={summary.account} onConfirm={found => { setRecipient(found); setStep(1); }} />}
        {step === 1 && <AmountStep balance={summary.balance} draft={draft} onBack={() => setStep(0)} onContinue={review} />}
        {step === 2 && (
          <ReviewStep
            holder={summary.holder}
            account={summary.account}
            recipient={recipient}
            draft={draft}
            sending={sending}
            error={error}
            onBack={() => setStep(1)}
            onConfirm={confirm}
          />
        )}
        {step === 3 && (
          <ResultCard
            title={stepTitles[3]}
            amount={formatCurrency(-receipt.amount)}
            rows={[
              { label: 'Para', value: receipt.recipient.name },
              { label: 'CUIT/CUIL', value: formatCuit(receipt.recipient.cuit), mono: true },
              { label: 'Entidad', value: receipt.recipient.bank },
              { label: 'Motivo', value: receipt.detail },
              { label: 'Fecha', value: formatDateTime(receipt.createdAt), mono: true },
              { label: 'N.º de operación', value: receipt.id, mono: true },
              { label: 'Tu saldo ahora', value: formatCurrency(summary.balance), mono: true },
            ]}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={restart} className={secondaryActionClass}>Realizar otra transferencia</button>
              <button type="button" onClick={() => navigate(routes.home)} className={primaryActionClass}>Volver al inicio</button>
            </div>
          </ResultCard>
        )}
      </section>

      <aside aria-label="Condiciones de la transferencia" className={`hidden gap-4 lg:grid ${panelClass}`}>
        <div>
          <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">Saldo disponible</p>
          <p className="m-0 mt-1 font-mono text-2xl font-semibold">{formatCurrency(summary.balance)}</p>
        </div>
        <dl className="m-0 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[#8C87A3] dark:text-[#9D97B5]">Límite por transferencia</dt>
            <dd className="m-0 font-mono">{formatCurrency(TRANSFER_LIMIT)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#8C87A3] dark:text-[#9D97B5]">Comisión</dt>
            <dd className="m-0 font-mono">{formatCurrency(0)}</dd>
          </div>
        </dl>
        <p className="m-0 flex gap-2 rounded-xl bg-[#F3F1F9] p-3 text-xs text-[#4A4560] dark:bg-[#1E1735] dark:text-[#9D97B5]">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Cada transferencia lleva una clave única: si se corta la conexión y reintentás, no se cobra dos veces.
        </p>
      </aside>
    </div>
  );
}

export default function TransferPage() {
  return (
    <AppLayout header={() => <PageHeader title="Transferir" subtitle="Enviá dinero con alias, CVU o CBU." />}>
      {summary => <TransferContent summary={summary} />}
    </AppLayout>
  );
}
