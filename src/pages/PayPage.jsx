import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraOff, Hash, Loader2, QrCode } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import { IconInput } from '@/components/auth/IconInput';
import Field from '@/components/forms/Field';
import ResultCard from '@/components/common/ResultCard';
import {
  alertClass,
  fieldInputClass,
  primaryActionClass,
  secondaryActionClass,
  sectionTitleClass,
} from '@/components/forms/formStyles';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { mockQrPayments } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

function Scanner({ onScan }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  async function startCamera() {
    setCameraError('');
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Cámara no soportada en este navegador');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch {
      setCameraActive(false);
      setCameraError('No pudimos acceder a la cámara. Verificá los permisos del navegador.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  function lookUp(event) {
    event.preventDefault();
    const payment = mockQrPayments.find(item => item.code.toLowerCase() === code.trim().toLowerCase());
    if (!payment) return setError('No encontramos un cobro con ese código.');
    setError('');
    stopCamera();
    onScan(payment);
  }

  return (
    <div className={`mx-auto max-w-xl grid gap-6 ${panelClass}`}>
      <div className="flex items-center justify-between">
        <h2 className={sectionTitleClass}>Escaneá el código del comercio</h2>
        <button
          type="button"
          onClick={cameraActive ? stopCamera : startCamera}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F1F9] px-3.5 py-1.5 text-xs font-semibold text-[#4C1DB8] hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#B9A6FF] dark:hover:bg-[#281F45]"
        >
          {cameraActive ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
          {cameraActive ? 'Apagar cámara' : 'Encender cámara'}
        </button>
      </div>

      <div className="relative mx-auto grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-[28px] bg-[#1C1633] dark:bg-[#0E0A1A]">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="grid place-items-center gap-3 p-6 text-center text-white/60">
            <QrCode className="size-20 text-white/20" aria-hidden="true" />
            <p className="m-0 text-xs max-w-xs">
              {cameraError || 'La cámara está desactivada. Podés encenderla o ingresar el código a mano.'}
            </p>
          </div>
        )}

        {['top-5 left-5 border-t-4 border-l-4 rounded-tl-2xl', 'top-5 right-5 border-t-4 border-r-4 rounded-tr-2xl', 'bottom-5 left-5 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-5 right-5 border-b-4 border-r-4 rounded-br-2xl'].map(corner => (
          <span key={corner} aria-hidden="true" className={`pointer-events-none absolute size-12 border-[#FFD54A] ${corner}`} />
        ))}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-[#FFD54A] shadow-[0_0_16px_#FFD54A] motion-safe:animate-pulse" />
      </div>

      <form onSubmit={lookUp} noValidate className="m-0 grid max-w-none gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field id="qr-code" label="O ingresá el código a mano" error={error}>
          <IconInput
            icon={Hash}
            id="qr-code"
            value={code}
            onChange={event => setCode(event.target.value)}
            placeholder="QR-CAFE-001"
            className={`${fieldInputClass} pl-11 font-mono uppercase`}
            aria-invalid={!!error}
          />
        </Field>
        <button type="submit" className={`${primaryActionClass} sm:w-auto ${error ? 'sm:mb-[22px]' : ''}`}>
          Buscar
        </button>
      </form>
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
            { label: 'Comercio', value: receipt.merchant },
            { label: 'Concepto', value: receipt.description },
            { label: 'Código QR', value: receipt.code, mono: true },
            { label: 'Fecha', value: formatDateTime(receipt.createdAt), mono: true },
            { label: 'N.º de operación', value: receipt.id, mono: true },
            { label: 'Tu saldo ahora', value: formatCurrency(summary.balance), mono: true },
          ]}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setReceipt(null); setPayment(null); }} className={secondaryActionClass}>
              Hacer otro pago
            </button>
            <button type="button" onClick={() => navigate(routes.home)} className={primaryActionClass}>
              Volver al inicio
            </button>
          </div>
        </ResultCard>
      </div>
    );
  }

  if (payment) {
    const insufficient = summary.balance < payment.amount;
    return (
      <div className={`mx-auto max-w-lg grid gap-6 ${panelClass}`}>
        <h2 className={sectionTitleClass}>Confirmá el pago</h2>
        <div className="rounded-2xl border border-[#ECE9F5] bg-[#F8F7FD] p-6 text-center dark:border-[#261E3D] dark:bg-[#1E1735]">
          <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">{payment.merchant}</p>
          <p className="mt-1 mb-0 font-mono text-3xl font-bold">{formatCurrency(payment.amount)}</p>
          <p className="mt-1 mb-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">{payment.description}</p>
        </div>

        <dl className="m-0 divide-y divide-[#ECE9F5] rounded-2xl border border-[#ECE9F5] bg-[#F8F7FD] px-4 py-1 text-sm dark:divide-[#261E3D] dark:border-[#261E3D] dark:bg-[#1E1735]">
          <div className="flex justify-between py-3">
            <dt className="text-[#8C87A3] dark:text-[#9D97B5]">Saldo disponible</dt>
            <dd className="m-0 font-mono font-semibold">{formatCurrency(summary.balance)}</dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-[#8C87A3] dark:text-[#9D97B5]">Te quedarían</dt>
            <dd className={`m-0 font-mono font-semibold ${insufficient ? 'text-red-600 dark:text-rose-400' : ''}`}>
              {formatCurrency(summary.balance - payment.amount)}
            </dd>
          </div>
        </dl>

        {insufficient && (
          <p role="alert" className={alertClass}>
            Tu saldo no alcanza para pagar este cobro.
          </p>
        )}
        {error && <p role="alert" className={alertClass}>{error}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setPayment(null)} disabled={paying} className={secondaryActionClass}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={pay}
            disabled={paying || insufficient}
            className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}
          >
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
