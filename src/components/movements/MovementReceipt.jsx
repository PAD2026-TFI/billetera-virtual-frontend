import { useState } from 'react';
import { Dialog } from 'radix-ui';
import { Check, CheckCircle2, Clock3, Copy, Share2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { secondaryActionClass } from '@/components/forms/formStyles';
import { iconTone, signedAmount, statusLabels } from './MovementRow';

const kindLabels = {
  transferIn: 'Transferencia recibida',
  transferOut: 'Transferencia enviada',
  payment: 'Pago con QR',
  topUp: 'Carga de saldo',
};

const fullDateTime = value =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
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

  return (
    <Dialog.Root open={open} onOpenChange={value => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#090613]/60 backdrop-blur-sm" />
        {movement && (
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92svh] overflow-y-auto rounded-t-[28px] bg-white p-6 font-[Poppins] text-[#1C1633] shadow-2xl sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] dark:border dark:border-[#261E3D] dark:bg-[#140F24] dark:text-[#F4F2FA]"
          >
            <div className="flex items-start justify-between">
              <span className={`grid size-12 place-items-center rounded-full ${iconTone(movement.amount > 0)}`}>
                {movement.status === 'completed' ? <CheckCircle2 className="size-6" aria-hidden="true" /> : <Clock3 className="size-6" aria-hidden="true" />}
              </span>
              <Dialog.Close
                aria-label="Cerrar comprobante"
                className="m-0 grid size-11 place-items-center rounded-full border-0 bg-[#F3F1F9] p-0 text-[#4A4560] hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#9D97B5]"
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>

            <Dialog.Title className="m-0 mt-4 text-sm font-medium text-[#8C87A3] dark:text-[#9D97B5]">Comprobante de {kindLabels[movement.kind]?.toLowerCase() ?? 'movimiento'}</Dialog.Title>
            <p className={`m-0 mt-1 font-mono text-[32px] leading-tight font-bold ${movement.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              {signedAmount(movement.amount)}
            </p>
            <p className="m-0 mt-1 text-[15px] font-medium">{movement.title}</p>

            <dl className="m-0 mt-6 grid gap-3 rounded-xl bg-[#F3F1F9] p-4 text-sm dark:bg-[#1E1735]">
              <ReceiptRow label="Estado">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${(statusLabels[movement.status] ?? statusLabels.completed).className}`}>
                  {(statusLabels[movement.status] ?? statusLabels.completed).text}
                </span>
              </ReceiptRow>
              <ReceiptRow label="Concepto">{movement.detail}</ReceiptRow>
              <ReceiptRow label="Fecha y hora"><span className="font-mono">{fullDateTime(movement.createdAt)}</span></ReceiptRow>
              {movement.balanceAfter !== undefined && (
                <ReceiptRow label="Saldo posterior"><span className="font-mono">{formatCurrency(movement.balanceAfter)}</span></ReceiptRow>
              )}
              <div className="grid gap-1">
                <dt className="text-[#8C87A3] dark:text-[#9D97B5]">N.º de operación</dt>
                <dd className="m-0 flex items-center justify-between gap-2">
                  <span className="min-w-0 font-mono break-all">{movement.id}</span>
                  <button
                    type="button"
                    onClick={() => copy(movement.id, 'id')}
                    aria-label={copied === 'id' ? 'Número copiado' : 'Copiar número de operación'}
                    className="m-0 grid size-11 shrink-0 place-items-center rounded-full border-0 bg-white p-0 text-[#4C1DB8] hover:bg-[#E9E5F6] dark:bg-[#140F24] dark:text-[#B9A6FF]"
                  >
                    {copied === 'id' ? <Check className="size-[18px]" aria-hidden="true" /> : <Copy className="size-[18px]" aria-hidden="true" />}
                  </button>
                </dd>
              </div>
            </dl>

            <button type="button" onClick={share} className={`${secondaryActionClass} mt-5 inline-flex items-center justify-center gap-2`}>
              <Share2 className="size-[18px]" aria-hidden="true" />
              {copied === 'receipt' ? 'Comprobante copiado' : 'Compartir comprobante'}
            </button>
          </Dialog.Content>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReceiptRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#8C87A3] dark:text-[#9D97B5]">{label}</dt>
      <dd className="m-0 text-right font-medium">{children}</dd>
    </div>
  );
}
