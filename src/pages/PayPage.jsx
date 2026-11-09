import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CameraOff,
  Hash,
  Loader2,
  QrCode,
  Store,
} from 'lucide-react';
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
import { fetchCheckoutLink } from '@/services/mocks/checkoutService';
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

  async function lookUp(event) {
    event.preventDefault();
    const trimmed = code.trim();
    const payment = mockQrPayments.find(item => item.code.toLowerCase() === trimmed.toLowerCase());
    if (payment) {
      setError('');
      stopCamera();
      onScan(payment);
      return;
    }
    if (import.meta.env.MODE !== 'test' && trimmed) {
      try {
        const link = await fetchCheckoutLink(trimmed);
        if (link && link.isPayable) {
          setError('');
          stopCamera();
          onScan({
            code: link.token,
            token: link.token,
            isBackendLink: true,
            merchant: link.merchantName || 'Comercio adherido padi.',
            description: link.title || link.description || 'Pago con QR',
            amount: link.amount,
          });
          return;
        }
      } catch {
        setError('No encontramos un cobro con ese código.');
        return;
      }
    }
    setError('No encontramos un cobro con ese código.');
  }

  return (
    <div className={`mx-auto grid max-w-xl gap-6 ${panelClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${
                cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-[#FFD54A]'
              }`}
            />
            {cameraActive ? 'Lector óptico activo' : 'Modo de ingreso manual'}
          </span>
          <h2 className={`${sectionTitleClass} m-0 mt-0.5 tracking-tight`}>
            Escaneá el código del comercio
          </h2>
        </div>

        <button
          type="button"
          onClick={cameraActive ? stopCamera : startCamera}
          className="m-0 inline-flex h-10 items-center gap-2 rounded-full border border-[#ECE9F5] bg-[#FAF9FE] px-4 text-xs font-semibold text-[#4C1DB8] transition-colors hover:bg-[#EDE7FC] dark:border-[#2C2247] dark:bg-[#19122C] dark:text-[#FFD54A] dark:hover:bg-[#241B3E]"
        >
          {cameraActive ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
          {cameraActive ? 'Apagar cámara' : 'Encender cámara'}
        </button>
      </div>

      <div className="relative mx-auto grid aspect-square w-full max-w-[340px] place-items-center overflow-hidden rounded-[28px] bg-gradient-to-b from-[#200E4B] via-[#13082E] to-[#090416] p-6 shadow-[0_24px_48px_-20px_rgba(32,14,75,0.85)] ring-1 ring-inset ring-white/15">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,213,74,0.12)_0%,transparent_68%)]"
        />

        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="relative z-10 grid place-items-center gap-3 text-center">
            <span className="grid size-20 place-items-center rounded-3xl bg-white/8 text-[#FFD54A] ring-1 ring-inset ring-white/15">
              <QrCode className="size-10 stroke-[1.8]" aria-hidden="true" />
            </span>
            <p className="m-0 max-w-[230px] text-xs leading-relaxed text-white/70">
              {cameraError || 'La cámara está desactivada. Podés encenderla o ingresar el código a mano.'}
            </p>
          </div>
        )}

        {[
          'top-5 left-5 border-t-[3px] border-l-[3px] rounded-tl-2xl',
          'top-5 right-5 border-t-[3px] border-r-[3px] rounded-tr-2xl',
          'bottom-5 left-5 border-b-[3px] border-l-[3px] rounded-bl-2xl',
          'bottom-5 right-5 border-b-[3px] border-r-[3px] rounded-br-2xl',
        ].map(corner => (
          <span
            key={corner}
            aria-hidden="true"
            className={`pointer-events-none absolute size-11 border-[#FFD54A] ${corner}`}
          />
        ))}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#FFD54A] to-transparent shadow-[0_0_16px_#FFD54A] motion-safe:animate-pulse"
        />
      </div>

      <div className="rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] p-4 dark:border-[#261E3D] dark:bg-[#19122C]">
        <form
          onSubmit={lookUp}
          noValidate
          className="m-0 grid max-w-none gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
        >
          <Field id="qr-code" label="O ingresá el código a mano" error={error}>
            <IconInput
              icon={Hash}
              id="qr-code"
              value={code}
              onChange={event => setCode(event.target.value)}
              placeholder="QR-CAFE-001"
              className={`${fieldInputClass} bg-white pl-11 font-mono uppercase dark:bg-[#120D20]`}
              aria-invalid={!!error}
            />
          </Field>
          <button
            type="submit"
            className={`${primaryActionClass} sm:w-auto sm:px-6 ${error ? 'sm:mb-[22px]' : ''}`}
          >
            Buscar
          </button>
        </form>
      </div>
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
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                setPayment(null);
              }}
              className={secondaryActionClass}
            >
              Hacer otro pago
            </button>
            <button
              type="button"
              onClick={() => navigate(routes.home)}
              className={primaryActionClass}
            >
              Volver al inicio
            </button>
          </div>
        </ResultCard>
      </div>
    );
  }

  if (payment) {
    const insufficient = summary.balance < payment.amount;
    const remaining = summary.balance - payment.amount;

    return (
      <div className={`mx-auto grid max-w-lg gap-5 animate-page-enter ${panelClass}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className={`${sectionTitleClass} m-0 tracking-tight`}>Confirmá el pago</h2>
          <span className="rounded-full bg-[#FFD54A]/25 px-3 py-1 font-mono text-xs font-semibold text-[#7A5400] ring-1 ring-inset ring-[#E5B822]/40 dark:bg-[#FFD54A]/15 dark:text-[#FFD54A] dark:ring-[#FFD54A]/30">
            {payment.code}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#231052] via-[#170A38] to-[#0D0620] p-6 text-white shadow-[0_20px_40px_-20px_rgba(37,16,87,0.8)] ring-1 ring-inset ring-white/15">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-12 size-44 rounded-full bg-[radial-gradient(circle,rgba(255,213,74,0.22)_0%,transparent_70%)]"
          />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white/70 uppercase">
                <Store className="size-3.5 text-[#FFD54A]" aria-hidden="true" />
                Comercio verificado
              </span>
              <p className="m-0 mt-1 text-lg font-bold text-white">{payment.merchant}</p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FFD54A]/15 text-[#FFD54A] ring-1 ring-inset ring-[#FFD54A]/35">
              <QrCode className="size-5" aria-hidden="true" />
            </span>
          </div>

          <p className="relative m-0 mt-5 font-mono text-[34px] leading-none font-bold tracking-[-0.03em] text-[#FFD54A] tabular-nums">
            {formatCurrency(payment.amount)}
          </p>
          <p className="relative m-0 mt-2 text-sm text-white/80">{payment.description}</p>
        </div>

        <dl className="m-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-[#ECE9F5] bg-gradient-to-r from-[#FAF9FE] via-white to-[#F5F2FC] p-4 text-xs dark:border-[#2C2247] dark:from-[#19122C] dark:via-[#161028] dark:to-[#1E1535]">
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
              Saldo disponible
            </dt>
            <dd className="m-0 mt-0.5 truncate font-mono text-sm font-bold text-[#1C1633] tabular-nums dark:text-[#F4F2FA]">
              {formatCurrency(summary.balance)}
            </dd>
          </div>

          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#FFD54A]"
          >
            <ArrowRight className="size-3.5" />
          </span>

          <div className="min-w-0 text-right">
            <dt className="text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
              Te quedarían
            </dt>
            <dd
              className={`m-0 mt-0.5 truncate font-mono text-sm font-bold tabular-nums ${
                insufficient
                  ? 'text-red-600 dark:text-rose-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(remaining)}
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
          <button
            type="button"
            onClick={() => setPayment(null)}
            disabled={paying}
            className={secondaryActionClass}
          >
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
    <AppLayout
      header={() => (
        <PageHeader
          title="Pagar con QR"
          subtitle="Pagá en comercios con el saldo de tu cuenta."
        />
      )}
    >
      {summary => <PayContent summary={summary} />}
    </AppLayout>
  );
}
