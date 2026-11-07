import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs } from 'radix-ui';
import { Link2Off, XCircle } from 'lucide-react';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import { Wordmark } from '@/components/auth/AuthLayout';
import ResultCard from '@/components/common/ResultCard';
import ThemeToggle from '@/components/common/ThemeToggle';
import OrderSummary from '@/components/checkout/OrderSummary';
import CardPaymentForm from '@/components/checkout/CardPaymentForm';
import WalletPayment from '@/components/checkout/WalletPayment';
import { panelClass } from '@/components/layout/AppLayout';
import { primaryActionClass, secondaryActionClass, sectionTitleClass, tabListClass, tabTriggerClass } from '@/components/forms/formStyles';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { CheckoutError, fetchCheckoutLink, payCheckoutWithCard, payCheckoutWithWallet } from '@/services/mocks/checkoutService';
import { hasActiveSession, useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';

const closedLinkMessages = {
  Completed: 'Este link ya fue pagado.',
  Expired: 'Este link venció. Pedile al comercio uno nuevo.',
  Cancelled: 'El comercio canceló este link de pago.',
};

function CheckoutShell({ children }) {
  return (
    <div className="min-h-svh bg-[#F1EEFA] font-[Poppins] text-[#1C1633] dark:bg-[#090613] dark:text-[#F4F2FA]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Wordmark className="dark:text-white" />
        <ThemeToggle />
      </header>
      <div role="main" className="mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8">{children}</div>
    </div>
  );
}

function NotFound() {
  return (
    <div className={`mx-auto grid max-w-md justify-items-center gap-3 text-center ${panelClass}`}>
      <span className="grid size-14 place-items-center rounded-full bg-[#F3F1F9] text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#B9A6FF]">
        <Link2Off className="size-7" aria-hidden="true" />
      </span>
      <h1 className="m-0 text-xl font-semibold">Este link de pago no existe</h1>
      <p className="m-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">Revisá que el link esté completo o pedile al comercio que te lo vuelva a enviar.</p>
    </div>
  );
}

function Receipt({ link, receipt }) {
  const navigate = useNavigate();
  const signedIn = hasActiveSession(useAuthStore(state => state.session));
  const method = receipt.paymentMethod === 'Card' ? `${receipt.cardBrand ?? 'Tarjeta'} terminada en ${receipt.cardLast4}` : 'Saldo de padi.';

  return (
    <div className={`mx-auto max-w-lg ${panelClass}`}>
      <ResultCard
        title="Pago aprobado"
        amount={formatCurrency(receipt.amount)}
        rows={[
          { label: 'Comercio', value: link.merchantName },
          { label: 'Concepto', value: link.title },
          { label: 'Medio de pago', value: method },
          ...(receipt.authorizationCode ? [{ label: 'Código de autorización', value: receipt.authorizationCode, mono: true }] : []),
          { label: 'Fecha', value: formatDateTime(receipt.paidAt), mono: true },
          { label: 'N.º de operación', value: receipt.paymentId.slice(0, 8).toUpperCase(), mono: true },
        ]}
      >
        {signedIn ? (
          <button type="button" onClick={() => navigate(routes.home)} className={primaryActionClass}>Ir a mi billetera</button>
        ) : (
          <p className="m-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">Ya podés cerrar esta ventana.</p>
        )}
      </ResultCard>
    </div>
  );
}

export default function CheckoutPage() {
  const token = useSearchParams()[0].get('token') ?? '';
  const payQr = useWalletStore(state => state.payQr);
  const [link, setLink] = useState(null);
  const [state, setState] = useState('loading');
  const [method, setMethod] = useState('wallet');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      setLink(await fetchCheckoutLink(token));
      setState('ready');
    } catch (failure) {
      setState(failure instanceof CheckoutError && failure.code === 'PAYMENT_LINK_NOT_FOUND' ? 'notFound' : 'error');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const expire = useCallback(() => setLink(current => ({ ...current, status: 'Expired', isPayable: false })), []);

  async function pay(request) {
    setError('');
    try {
      setReceipt(await request());
    } catch (failure) {
      setError(failure.message);
    }
  }

  function chooseMethod(value) {
    setMethod(value);
    setError('');
  }

  if (state === 'loading') {
    return (
      <CheckoutShell>
        <div aria-busy="true" aria-label="Cargando la orden" className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="h-80 animate-pulse rounded-[28px] bg-[#E2DCF5] dark:bg-[#1E1735]" />
          <div className="h-96 animate-pulse rounded-[28px] bg-[#E2DCF5] dark:bg-[#1E1735]" />
        </div>
      </CheckoutShell>
    );
  }
  if (state === 'notFound') return <CheckoutShell><NotFound /></CheckoutShell>;
  if (state === 'error') {
    return (
      <CheckoutShell>
        <div role="alert" className={`mx-auto grid max-w-md gap-4 text-center ${panelClass}`}>
          <p className="m-0 font-semibold">No pudimos cargar la orden.</p>
          <button type="button" onClick={load} className={primaryActionClass}>Reintentar</button>
        </div>
      </CheckoutShell>
    );
  }
  if (receipt) return <CheckoutShell><Receipt link={link} receipt={receipt} /></CheckoutShell>;

  return (
    <CheckoutShell>
      <h1 className="sr-only">Pagar a {link.merchantName}</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        <div className={panelClass}>
          <OrderSummary link={link} onExpire={expire} />
        </div>

        <section aria-labelledby="payment-title" className={`grid gap-5 ${panelClass}`}>
          <h2 id="payment-title" className={sectionTitleClass}>Elegí cómo pagar</h2>
          {link.isPayable ? (
            <>
              {error && (
                <div role="alert" className="grid gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-rose-950/40 dark:text-rose-300">
                  <p className="m-0 flex items-start gap-2 font-semibold">
                    <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    Pago rechazado: {error}
                  </p>
                  <p className="m-0">La orden sigue reservada. Podés corregir los datos o probar con otro medio de pago.</p>
                  {method === 'card' && (
                    <button type="button" onClick={() => chooseMethod('wallet')} className={secondaryActionClass}>Pagar con saldo de padi.</button>
                  )}
                </div>
              )}
              <Tabs.Root value={method} onValueChange={chooseMethod} className="grid gap-5">
                <Tabs.List aria-label="Medio de pago" className={tabListClass}>
                  <Tabs.Trigger value="wallet" className={tabTriggerClass}>Saldo de padi.</Tabs.Trigger>
                  <Tabs.Trigger value="card" className={tabTriggerClass}>Tarjeta</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="wallet">
                  <WalletPayment amount={link.amount} onPay={() => pay(() => payCheckoutWithWallet(token, payQr))} />
                </Tabs.Content>
                <Tabs.Content value="card">
                  <CardPaymentForm amount={link.amount} onPay={card => pay(() => payCheckoutWithCard(token, card))} />
                </Tabs.Content>
              </Tabs.Root>
            </>
          ) : (
            <p role="status" className="m-0 rounded-xl bg-[#F3F1F9] p-4 text-sm text-[#4A4560] dark:bg-[#1E1735] dark:text-[#9D97B5]">
              {closedLinkMessages[link.status] ?? 'Este link ya no admite pagos.'}
            </p>
          )}
        </section>
      </div>
    </CheckoutShell>
  );
}
