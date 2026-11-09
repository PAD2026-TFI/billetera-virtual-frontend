import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Download, Lock, ShieldCheck, Wallet, Zap } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import ResultCard from '@/components/common/ResultCard';
import { primaryActionClass, secondaryActionClass, sectionTitleClass } from '@/components/forms/formStyles';
import TransferStepper from '@/components/transfer/TransferStepper';
import RecipientStep from '@/components/transfer/RecipientStep';
import AmountStep from '@/components/transfer/AmountStep';
import ReviewStep from '@/components/transfer/ReviewStep';
import { formatCuit, formatCurrency, formatDateTime } from '@/lib/formatters';
import { downloadReceiptPdf } from '@/lib/pdfReceipt';
import { routes } from '@/lib/routes';
import { TRANSFER_LIMIT } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

const stepTitles = [
  '¿A quién le transferís?',
  '¿Cuánto querés transferir?',
  'Revisá antes de confirmar',
  'Transferencia enviada',
];

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
    <div className="flex h-full min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_350px] lg:items-stretch lg:gap-7">
      <section
        aria-label="Transferencia"
        className={`m-0 flex h-full min-h-0 flex-1 flex-col justify-between gap-3 overflow-hidden p-4 sm:p-5 lg:flex lg:h-full lg:max-h-none lg:gap-6 lg:overflow-visible lg:p-7 ${panelClass}`}
      >
        <TransferStepper current={step} />
        {step < 3 && <h2 className={`${sectionTitleClass} m-0 tracking-tight`}>{stepTitles[step]}</h2>}

        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden">
          {step === 0 && (
            <RecipientStep
              account={summary.account}
              onConfirm={found => {
                setRecipient(found);
                setStep(1);
              }}
            />
          )}
          {step === 1 && (
            <AmountStep
              balance={summary.balance}
              draft={draft}
              onBack={() => setStep(0)}
              onContinue={review}
            />
          )}
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
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
              <ResultCard
                title={stepTitles[3]}
                amount={formatCurrency(-receipt.amount)}
                rows={[
                  { label: 'De', value: `${summary.holder.firstName} ${summary.holder.lastName}`.trim() },
                  { label: 'Para', value: receipt.recipient.name },
                  { label: 'CUIT/CUIL', value: formatCuit(receipt.recipient.cuit), mono: true },
                  { label: 'Entidad', value: receipt.recipient.bank },
                  { label: 'Motivo', value: receipt.detail },
                  { label: 'Fecha', value: formatDateTime(receipt.createdAt), mono: true },
                  { label: 'N.º de operación', value: receipt.id, mono: true },
                  { label: 'Tu saldo ahora', value: formatCurrency(summary.balance), mono: true },
                ]}
              >
                <div className="grid gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadReceiptPdf({
                        title: 'Comprobante de Transferencia enviada',
                        operationId: receipt.id,
                        amount: receipt.amount,
                        createdAt: receipt.createdAt,
                        senderName: `${summary.holder.firstName} ${summary.holder.lastName}`.trim(),
                        recipientName: receipt.recipient.name,
                        recipientCuit: receipt.recipient.cuit,
                        recipientBank: receipt.recipient.bank,
                        concept: receipt.detail,
                      })
                    }
                    className="m-0 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#5B2EE0] bg-[#FAF8FE] text-sm font-semibold text-[#5B2EE0] transition-colors hover:bg-[#5B2EE0]/10 dark:border-[#5B2EE0] dark:bg-[#1E1735] dark:text-[#FFD54A] dark:hover:bg-[#281F45]"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Descargar comprobante en PDF
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={restart} className={secondaryActionClass}>
                      Realizar otra transferencia
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(routes.home)}
                      className={primaryActionClass}
                    >
                      Volver al inicio
                    </button>
                  </div>
                </div>
              </ResultCard>
            </div>
          )}
        </div>
      </section>

      <aside
        aria-label="Condiciones de la transferencia"
        className={`hidden lg:flex lg:h-full lg:flex-col lg:justify-between lg:gap-6 ${panelClass}`}
      >
        <div className="flex flex-col gap-5">
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#231052] via-[#170A38] to-[#0D0620] p-5 text-white shadow-[0_20px_40px_-20px_rgba(37,16,87,0.8)] ring-1 ring-inset ring-white/15">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-12 size-44 rounded-full bg-[radial-gradient(circle,rgba(255,213,74,0.22)_0%,transparent_70%)]"
            />

            <div className="relative flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white/75 uppercase">
                <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Saldo disponible
              </span>
              <span className="grid size-9 place-items-center rounded-xl bg-[#FFD54A]/15 text-[#FFD54A] ring-1 ring-inset ring-[#FFD54A]/35">
                <Wallet className="size-4 stroke-[2.2]" aria-hidden="true" />
              </span>
            </div>

            <p className="relative m-0 mt-3 font-mono text-[30px] leading-none font-bold tracking-[-0.03em] text-[#FFD54A] tabular-nums">
              {formatCurrency(summary.balance)}
            </p>

            {summary.account?.alias && (
              <p className="relative m-0 mt-3 flex items-center justify-between gap-2 border-t border-white/12 pt-2.5 font-mono text-xs text-white/80">
                <span className="font-[Poppins] text-[11px] font-medium text-white/55">Tu alias</span>
                <span className="truncate font-semibold text-white">{summary.account.alias}</span>
              </p>
            )}
          </div>

          <div className="rounded-[22px] border border-[#ECE9F5] bg-[#FAF9FE] p-4 dark:border-[#261E3D] dark:bg-[#19122C]">
            <p className="m-0 mb-3 text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
              Detalles de la operación
            </p>
            <dl className="m-0 divide-y divide-[#ECE9F5] text-xs dark:divide-[#251C3D]">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="flex items-center gap-2.5 text-[#4A4560] dark:text-[#9D97B5]">
                  <span className="grid size-7 place-items-center rounded-lg bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#C4B2FF]">
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>Límite por operación</span>
                </dt>
                <dd className="m-0 font-mono font-bold text-[#1C1633] tabular-nums dark:text-[#F4F2FA]">
                  {formatCurrency(TRANSFER_LIMIT)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="flex items-center gap-2.5 text-[#4A4560] dark:text-[#9D97B5]">
                  <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>Comisión</span>
                </dt>
                <dd className="m-0 flex items-center gap-1.5 font-mono font-bold text-[#1C1633] dark:text-[#F4F2FA]">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-[Poppins] text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300">
                    Bonificado
                  </span>
                  <span>{formatCurrency(0)}</span>
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="flex items-center gap-2.5 text-[#4A4560] dark:text-[#9D97B5]">
                  <span className="grid size-7 place-items-center rounded-lg bg-[#FFD54A]/25 text-[#7A5400] dark:bg-[#FFD54A]/15 dark:text-[#FFD54A]">
                    <Zap className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>Acreditación</span>
                </dt>
                <dd className="m-0 text-xs font-bold text-[#1C1633] dark:text-[#F4F2FA]">
                  En el acto (24/7)
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-[22px] border border-emerald-500/20 bg-gradient-to-br from-white via-[#F6FCF9] to-[#EBF9F2] p-4 dark:border-emerald-500/20 dark:from-[#140F24] dark:via-[#111B22] dark:to-[#0C211C]">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-300">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <span>Garantía de idempotencia</span>
          </div>
          <p className="m-0 mt-2.5 text-xs leading-relaxed text-[#4A4560] dark:text-[#9D97B5]">
            Cada transferencia lleva una clave única: si se corta la conexión y reintentás, no se cobra dos veces.
          </p>
          <div className="mt-3 flex items-center gap-2 border-t border-emerald-500/15 pt-2.5 text-[11px] font-medium text-[#5A5475] dark:border-emerald-500/15 dark:text-[#8C87A3]">
            <Lock className="size-3 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <span>Cifrado bancario de extremo a extremo</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function TransferPage() {
  return (
    <AppLayout
      fitViewportMobile
      header={() => (
        <PageHeader
          title="Transferir"
          subtitle="Enviá dinero con alias, CVU o CBU."
          compactMobile
        />
      )}
    >
      {summary => <TransferContent summary={summary} />}
    </AppLayout>
  );
}
