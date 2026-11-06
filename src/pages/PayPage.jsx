import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Loader2, QrCode, Store } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import { IconInput } from '@/components/auth/IconInput';
import Field from '@/components/forms/Field';
import ResultCard from '@/components/common/ResultCard';
import { alertClass, fieldInputClass, primaryActionClass, secondaryActionClass, sectionTitleClass } from '@/components/forms/formStyles';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { mockQrPayments } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

function Scanner({ onScan }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function lookUp(event) {
    event.preventDefault();
    const payment = mockQrPayments.find(item => item.code.toLowerCase() === code.trim().toLowerCase());
    if (!payment) return setError('No encontramos un cobro con ese código.');
    setError('');
    onScan(payment);
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className={`grid gap-6 ${panelClass}`}>
        <h2 className={sectionTitleClass}>Escaneá el código del comercio</h2>
        <div className="relative mx-auto grid aspect-square w-full max-w-xs place-items-center overflow-hidden rounded-[28px] bg-[#1C1633] dark:bg-[#0E0A1A]">
          <QrCode className="size-24 text-white/15" aria-hidden="true" />
          {['top-5 left-5 border-t-4 border-l-4 rounded-tl-2xl', 'top-5 right-5 border-t-4 border-r-4 rounded-tr-2xl', 'bottom-5 left-5 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-5 right-5 border-b-4 border-r-4 rounded-br-2xl'].map(corner => (
            <span key={corner} aria-hidden="true" className={`absolute size-12 border-[#FFD54A] ${corner}`} />
          ))}
          <span aria-hidden="true" className="absolute inset-x-8 top-1/2 h-0.5 bg-[#FFD54A] shadow-[0_0_16px_#FFD54A] motion-safe:animate-pulse" />
          <p className="absolute bottom-8 m-0 text-xs text-white/60">La cámara se habilita en la versión final</p>
        </div>
        <form onSubmit={lookUp} noValidate className="m-0 grid max-w-none gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field id="qr-code" label="O ingresá el código a mano" error={error}>
            <IconInput icon={Hash} id="qr-code" value={code} onChange={event => setCode(event.target.value)} placeholder="QR-CAFE-001" className={`${fieldInputClass} pl-11 font-mono uppercase`} aria-invalid={!!error} />
          </Field>
          <button type="submit" className={`${primaryActionClass} sm:w-auto ${error ? 'sm:mb-[22px]' : ''}`}>Buscar</button>
        </form>
      </div>

      <section aria-labelledby="test-codes-title" className={`m-0 grid gap-3 border-0 ${panelClass}`}>
        <h2 id="test-codes-title" className={sectionTitleClass}>Códigos de prueba</h2>
        <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">Tocá uno para simular que lo escaneaste.</p>
        <ul className="m-0 grid list-none gap-2 p-0">
          {mockQrPayments.map(payment => (
            <li key={payment.code}>
              <button
                type="button"
                onClick={() => onScan(payment)}
                className="m-0 flex w-full items-center gap-3 rounded-2xl border-0 bg-[#F8F7FD] p-3 text-left hover:bg-[#F3F1F9] dark:bg-[#1E1735] dark:hover:bg-[#281F45]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E6DFFB] text-[#4C1DB8] dark:bg-[#281F45] dark:text-[#B9A6FF]">
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#1C1633] dark:text-[#F4F2FA]">{payment.merchant}</span>
                  <span className="block font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">{payment.code}</span>
                </span>
                <span className="font-mono text-sm font-semibold text-[#1C1633] dark:text-[#F4F2FA]">{formatCurrency(payment.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PayContent({ summary }) {
  const navigate = useNavigate();
  const payQr = useWalletStore(state => state.payQr);
  const [payment, setPayment] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setPaying(true);
    setError('');
    try {
      setReceipt(await payQr(payment));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPaying(false);
    }
  }

  if (receipt) {
    return (
      <div className={`mx-auto max-w-lg ${panelClass}`}>
        <ResultCard
          title="Pago realizado"
          amount={formatCurrency(-receipt.amount)}
          rows={[
            { label: 'Comercio', value: receipt.title },
            { label: 'Fecha', value: formatDateTime(receipt.createdAt), mono: true },
            { label: 'Número de operación', value: receipt.id, mono: true },
          ]}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setReceipt(null); setPayment(null); }} className={secondaryActionClass}>Pagar otro</button>
            <button type="button" onClick={() => navigate(routes.home)} className={primaryActionClass}>Volver al inicio</button>
          </div>
        </ResultCard>
      </div>
    );
  }

  if (payment) {
    return (
      <div className={`mx-auto grid max-w-lg gap-6 ${panelClass}`}>
        <h2 className={sectionTitleClass}>Confirmá el pago</h2>
        <div className="rounded-2xl bg-[#F8F7FD] p-5 text-center dark:bg-[#1E1735]">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#E6DFFB] text-[#4C1DB8] dark:bg-[#281F45] dark:text-[#B9A6FF]">
            <Store className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-3 mb-0 font-semibold">{payment.merchant}</p>
          <p className="mt-0.5 mb-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">{payment.description}</p>
          <p className="mt-4 mb-0 font-mono text-3xl font-semibold">{formatCurrency(payment.amount)}</p>
          <p className="mt-2 mb-0 text-xs text-[#8C87A3] dark:text-[#9D97B5]">Saldo disponible: <span className="font-mono">{formatCurrency(summary.balance)}</span></p>
        </div>
        {error && <p role="alert" className={alertClass}>{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setPayment(null)} disabled={paying} className={secondaryActionClass}>Cancelar</button>
          <button type="button" onClick={pay} disabled={paying} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
            {paying && <Loader2 className="size-4 animate-spin" />}
            {paying ? 'Pagando…' : 'Pagar'}
          </button>
        </div>
      </div>
    );
  }

  return <Scanner onScan={setPayment} />;
}

export default function PayPage() {
  return (
    <AppLayout header={() => <PageHeader title="Pagar con QR" subtitle="Pagá en comercios con el saldo de tu cuenta." />}>
      {summary => <PayContent summary={summary} />}
    </AppLayout>
  );
}
