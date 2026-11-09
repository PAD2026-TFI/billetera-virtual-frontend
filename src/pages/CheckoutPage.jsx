import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs } from 'radix-ui';
import { CreditCard, Link2Off, Lock, Wallet, XCircle } from 'lucide-react';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import { Wordmark } from '@/components/auth/AuthLayout';
import ResultCard from '@/components/common/ResultCard';
import ThemeToggle from '@/components/common/ThemeToggle';
import OrderSummary from '@/components/checkout/OrderSummary';
import CardPaymentForm from '@/components/checkout/CardPaymentForm';
import WalletPayment from '@/components/checkout/WalletPayment';
import { primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
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

const cardContainerClass =
  'rounded-[28px] border border-[#ECE9F5] bg-white p-6 shadow-[0_20px_50px_rgba(76,29,184,0.06)] dark:border-[#261E3D] dark:bg-[#140F24] dark:shadow-[0_0_40px_rgba(91,46,224,0.12)] sm:p-8 flex h-full flex-col justify-between';

function CheckoutShell({ children }) {
  return (
    <div className="min-h-svh bg-[#F1EEFA] font-[Poppins] text-[#1C1633] transition-colors dark:bg-[#090613] dark:text-[#F4F2FA]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <Wordmark className="dark:text-white" />
        <ThemeToggle />
      </header>
      <div role="main" className="mx-auto w-full max-w-5xl px-5 pb-12 sm:px-8">{children}</div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-4 rounded-[28px] border border-[#ECE9F5] bg-white p-8 text-center shadow-[0_20px_50px_rgba(76,29,184,0.06)] dark:border-[#261E3D] dark:bg-[#140F24] dark:shadow-[0_0_40px_rgba(91,46,224,0.12)]">
      <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#4C1DB8]/10 to-[#6C3BF4]/10 text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#FFD54A]">
        <Link2Off className="size-8" aria-hidden="true" />
      </span>
      <h1 className="m-0 text-xl font-bold text-[#1C1633] dark:text-[#F4F2FA]">Este link de pago no existe</h1>
      <p className="m-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">Revisá que el link esté completo o pedile al comercio que te lo vuelva a enviar.</p>
    </div>
  );
}

function Receipt({ link, receipt }) {
  const navigate = useNavigate();
  const signedIn = hasActiveSession(useAuthStore(state => state.session));
  const method = receipt.paymentMethod === 'Card' ? `${receipt.cardBrand ?? 'Tarjeta'} terminada en ${receipt.cardLast4}` : 'Saldo de padi.';

  return (
    <div className="mx-auto max-w-lg rounded-[28px] border border-[#ECE9F5] bg-white p-6 shadow-[0_20px_50px_rgba(76,29,184,0.06)] dark:border-[#261E3D] dark:bg-[#140F24] dark:shadow-[0_0_40px_rgba(91,46,224,0.12)] sm:p-8">
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
          <button type="button" onClick={() => navigate(routes.home)} className={`${primaryActionClass} h-12 rounded-full text-[15px]`}>Ir a mi billetera</button>
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
        <div aria-busy="true" aria-label="Cargando la orden" className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
          <div className="h-[520px] animate-pulse rounded-[28px] border border-[#ECE9F5] bg-white/70 dark:border-[#261E3D] dark:bg-[#140F24]/70" />
          <div className="h-[520px] animate-pulse rounded-[28px] border border-[#ECE9F5] bg-white/70 dark:border-[#261E3D] dark:bg-[#140F24]/70" />
        </div>
      </CheckoutShell>
    );
  }
  if (state === 'notFound') return <CheckoutShell><NotFound /></CheckoutShell>;
  if (state === 'error') {
    return (
      <CheckoutShell>
        <div role="alert" className="mx-auto grid max-w-md gap-4 rounded-[28px] border border-[#ECE9F5] bg-white p-8 text-center shadow-lg dark:border-[#261E3D] dark:bg-[#140F24]">
          <p className="m-0 font-semibold text-[#1C1633] dark:text-[#F4F2FA]">No pudimos cargar la orden.</p>
          <button type="button" onClick={load} className={`${primaryActionClass} h-12 rounded-full`}>Reintentar</button>
        </div>
      </CheckoutShell>
    );
  }
  if (receipt) return <CheckoutShell><Receipt link={link} receipt={receipt} /></CheckoutShell>;

  return (
    <CheckoutShell>
      <h1 className="sr-only">Pagar a {link.merchantName}</h1>
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
        <div className={cardContainerClass}>
          <OrderSummary link={link} onExpire={expire} />
        </div>

        <section
          aria-labelledby="payment-title"
          className={cardContainerClass}
        >
          <div className="grid gap-6">
            <div className="flex items-center justify-between gap-4">
              <h2 id="payment-title" className="m-0 text-xl font-bold tracking-tight text-[#1C1633] dark:text-[#F4F2FA]">
                Elegí cómo pagar
              </h2>
              <span className="flex items-center gap-1.5 rounded-full bg-[#F3F1F9] px-3 py-1 text-xs font-semibold text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#FFD54A]">
                <Lock className="size-3.5" aria-hidden="true" />
                Seguro
              </span>
            </div>

            {link.isPayable ? (
              <>
                {error && (
                  <div role="alert" className="grid gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                    <p className="m-0 flex items-start gap-2 font-semibold">
                      <XCircle className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
                      Pago rechazado: {error}
                    </p>
                    <p className="m-0 text-xs">La orden sigue reservada. Podés corregir los datos o probar con otro medio de pago.</p>
                    {method === 'card' && (
                      <button
                        type="button"
                        onClick={() => chooseMethod('wallet')}
                        className={`${secondaryActionClass} h-10 rounded-full text-xs font-semibold`}
                      >
                        Pagar con saldo de padi.
                      </button>
                    )}
                  </div>
                )}

                <Tabs.Root value={method} onValueChange={chooseMethod} className="flex flex-1 flex-col justify-between gap-6">
                  <Tabs.List aria-label="Medio de pago" className="flex gap-1.5 rounded-full border border-[#ECE9F5] bg-[#F3F1F9] p-1.5 dark:border-[#261E3D] dark:bg-[#1E1735]">
                    <Tabs.Trigger
                      value="wallet"
                      className="m-0 flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-0 bg-transparent px-4 text-sm font-semibold text-[#4A4560] transition-all data-[state=active]:bg-white data-[state=active]:text-[#4C1DB8] data-[state=active]:shadow-sm dark:text-[#9D97B5] dark:data-[state=active]:bg-[#281F45] dark:data-[state=active]:text-[#F4F2FA]"
                    >
                      <Wallet className="size-4 shrink-0" aria-hidden="true" />
                      Saldo de padi.
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="card"
                      className="m-0 flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-0 bg-transparent px-4 text-sm font-semibold text-[#4A4560] transition-all data-[state=active]:bg-white data-[state=active]:text-[#4C1DB8] data-[state=active]:shadow-sm dark:text-[#9D97B5] dark:data-[state=active]:bg-[#281F45] dark:data-[state=active]:text-[#F4F2FA]"
                    >
                      <CreditCard className="size-4 shrink-0" aria-hidden="true" />
                      Tarjeta
                    </Tabs.Trigger>
                  </Tabs.List>

                  <Tabs.Content value="wallet" className="outline-none flex-1">
                    <WalletPayment amount={link.amount} onPay={() => pay(() => payCheckoutWithWallet(token, payQr))} />
                  </Tabs.Content>
                  <Tabs.Content value="card" className="outline-none flex-1">
                    <CardPaymentForm amount={link.amount} onPay={card => pay(() => payCheckoutWithCard(token, card))} />
                  </Tabs.Content>
                </Tabs.Root>
              </>
            ) : (
              <p role="status" className="m-0 rounded-2xl border border-[#ECE9F5] bg-[#F3F1F9] p-5 text-sm font-medium text-[#4A4560] dark:border-[#261E3D] dark:bg-[#1E1735] dark:text-[#9D97B5]">
                {closedLinkMessages[link.status] ?? 'Este link ya no admite pagos.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </CheckoutShell>
  );
}
