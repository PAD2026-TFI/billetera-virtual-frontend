import { useState } from 'react';
import { Dialog } from 'radix-ui';
import { Check, CheckCircle2, Clock3, Copy, Download, Share2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { secondaryActionClass } from '@/components/forms/formStyles';
import { downloadReceiptPdf } from '@/lib/pdfReceipt';
import { useWalletStore } from '@/store/useWalletStore';
import { iconTone, signedAmount, statusLabels } from './MovementRow';

const kindLabels = {
  transferIn: 'Transferencia recibida',
  transferOut: 'Transferencia enviada',
  payment: 'Pago con QR',
  topUp: 'Carga de saldo',
};

const fullDateTime = value =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));

function receiptText(movement) {
  return [
    'Comprobante padi.',
    `${movement.title} — ${signedAmount(movement.amount)}`,
    `Fecha: ${fullDateTime(movement.createdAt)}`,
    `Operación: ${movement.id}`,
  ].join('\n');
}

export default function MovementReceipt({ movement, onClose }) {
  const [copied, setCopied] = useState(null);
  const open = movement !== null;

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  async function share() {
    const text = receiptText(movement);
    if (navigator.share) {
      await navigator.share({ title: 'Comprobante padi.', text }).catch(() => {});
    } else {
      await copy(text, 'receipt');
    }
  }

  const isIncome = movement ? movement.amount > 0 : false;
  const status = movement ? statusLabels[movement.status] ?? statusLabels.completed : statusLabels.completed;
  const holder = useWalletStore(state => state.summary?.holder);
  const holderName = holder ? `${holder.firstName} ${holder.lastName}`.trim() : 'Tu cuenta';
  const isTransfer = movement?.kind === 'transferIn' || movement?.kind === 'transferOut';
  const senderName = isIncome ? (movement?.senderName || movement?.title?.replace(/^De\s+/i, '') || 'Titular remitente') : holderName;
  const recipientName = isIncome ? holderName : (movement?.recipient?.name || movement?.title?.replace(/^Transferencia a\s+/i, '') || 'Destinatario');

  return (
    <Dialog.Root open={open} onOpenChange={value => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#090613]/70 backdrop-blur-md" />
        {movement && (
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92svh] overflow-y-auto rounded-t-[32px] bg-white p-6 font-[Poppins] text-[#1C1633] shadow-[0_-20px_60px_rgba(9,6,19,0.45)] sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[32px] sm:shadow-[0_32px_80px_-20px_rgba(9,6,19,0.65)] dark:border dark:border-[#2C2247] dark:bg-[#140F24] dark:text-[#F4F2FA]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`grid size-11 place-items-center rounded-2xl ${iconTone(movement.kind, isIncome)}`}>
                  {movement.status === 'completed' ? (
                    <CheckCircle2 className="size-5 stroke-[2.2]" aria-hidden="true" />
                  ) : (
                    <Clock3 className="size-5 stroke-[2.2]" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <span className="inline-flex items-end text-sm leading-none font-bold tracking-[-0.04em] text-[#2A0E7A] dark:text-white">
                    padi
                    <span aria-hidden="true" className="mb-[0.1em] ml-[0.06em] size-1.5 rounded-full bg-[#FFD54A]" />
                  </span>
                  <Dialog.Title className="m-0 text-xs font-medium text-[#6E6888] dark:text-[#9D97B5]">
                    Comprobante de {kindLabels[movement.kind]?.toLowerCase() ?? 'movimiento'}
                  </Dialog.Title>
                </div>
              </div>

              <Dialog.Close
                aria-label="Cerrar comprobante"
                className="m-0 grid size-10 place-items-center rounded-full border-0 bg-[#F3F1F9] p-0 text-[#4A4560] transition-colors hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#9D97B5] dark:hover:bg-[#281F45]"
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F8F6FC] p-5 text-center dark:bg-[#1B1430]">
              <p
                className={`m-0 font-mono text-[34px] leading-none font-bold tracking-[-0.03em] tabular-nums ${
                  isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#1C1633] dark:text-[#F4F2FA]'
                }`}
              >
                {signedAmount(movement.amount)}
              </p>
              <p className="m-0 mt-2 text-[15px] font-semibold text-[#1C1633] dark:text-[#F4F2FA]">
                {movement.title}
              </p>
            </div>

            <div aria-hidden="true" className="relative my-5 flex items-center">
              <span className="w-full border-t border-dashed border-[#DFD9F0] dark:border-[#2E244A]" />
            </div>

            <dl className="m-0 grid gap-3.5 text-sm">
              <ReceiptRow label="Estado">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${status.dotClass}`} />
                  {status.text}
                </span>
              </ReceiptRow>
              {isTransfer && <ReceiptRow label="De">{senderName}</ReceiptRow>}
              {isTransfer && <ReceiptRow label="Para">{recipientName}</ReceiptRow>}
              <ReceiptRow label="Concepto">{movement.detail}</ReceiptRow>
              <ReceiptRow label="Fecha y hora">
                <span className="font-mono text-xs sm:text-sm">{fullDateTime(movement.createdAt)}</span>
              </ReceiptRow>
              {movement.balanceAfter !== undefined && (
                <ReceiptRow label="Saldo posterior">
                  <span className="font-mono font-semibold">{formatCurrency(movement.balanceAfter)}</span>
                </ReceiptRow>
              )}
              <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] px-3.5 py-2.5 dark:border-[#261E3D] dark:bg-[#19122C]">
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium tracking-wide text-[#8C87A3] uppercase dark:text-[#9D97B5]">
                    N.º de operación
                  </dt>
                  <dd className="m-0 mt-0.5 font-mono text-xs font-semibold break-all text-[#1C1633] dark:text-[#F4F2FA]">
                    {movement.id}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => copy(movement.id, 'id')}
                  aria-label={copied === 'id' ? 'Número copiado' : 'Copiar número de operación'}
                  className="m-0 grid size-10 shrink-0 place-items-center rounded-full border-0 bg-white p-0 text-[#4C1DB8] shadow-xs transition-colors hover:bg-[#E9E5F6] dark:bg-[#241B3E] dark:text-[#FFD54A] dark:hover:bg-[#2F2450]"
                >
                  {copied === 'id' ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </dl>

            <div className="mt-6 grid gap-2.5">
              <button
                type="button"
                onClick={() =>
                  downloadReceiptPdf({
                    title: `Comprobante de ${kindLabels[movement.kind]?.toLowerCase() ?? 'movimiento'}`,
                    operationId: movement.id,
                    amount: Math.abs(movement.amount),
                    createdAt: movement.createdAt,
                    senderName: isIncome ? (movement.senderName || movement.title?.replace(/^De\s+/i, '') || 'Titular remitente') : 'Titular de la cuenta',
                    recipientName: isIncome ? 'Tu cuenta padi.' : (movement.recipient?.name || movement.title?.replace(/^Transferencia a\s+/i, '') || 'Destinatario'),
                    concept: movement.detail,
                  })
                }
                className="m-0 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#5B2EE0] bg-[#FAF8FE] text-sm font-semibold text-[#5B2EE0] transition-colors hover:bg-[#5B2EE0]/10 dark:border-[#5B2EE0] dark:bg-[#1E1735] dark:text-[#FFD54A] dark:hover:bg-[#281F45]"
              >
                <Download className="size-4" aria-hidden="true" />
                Descargar comprobante en PDF
              </button>

              <button
                type="button"
                onClick={share}
                className={`${secondaryActionClass} inline-flex items-center justify-center gap-2`}
              >
                <Share2 className="size-[18px]" aria-hidden="true" />
                {copied === 'receipt' ? 'Comprobante copiado' : 'Compartir comprobante'}
              </button>
            </div>
          </Dialog.Content>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReceiptRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#6E6888] dark:text-[#9D97B5]">{label}</dt>
      <dd className="m-0 text-right font-medium text-[#1C1633] dark:text-[#F4F2FA]">{children}</dd>
    </div>
  );
}
