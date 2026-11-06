import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { money, parseAmount, safeCheckout } from '@/api.js';
import { useAuthStore } from '@/store/useAuthStore.js';

const statusText = {
  Created: 'Preparando carga',
  Unknown: 'Resultado por confirmar',
  Pending: 'Pago pendiente',
  Approved: 'Saldo acreditado',
  Rejected: 'Pago rechazado',
  Cancelled: 'Pago cancelado',
  Error: 'No se pudo iniciar el pago',
};

const querySchema = z.object({
  queryId: z.string().trim().min(1, 'Ingresá el identificador de operación.'),
});

export default function WalletPage() {
  const session = useAuthStore(state => state.session);
  const busy = useAuthStore(state => state.busy);
  const error = useAuthStore(state => state.error);
  const wallet = useAuthStore(state => state.wallet);
  const config = useAuthStore(state => state.config);
  const movements = useAuthStore(state => state.movements);
  const intent = useAuthStore(state => state.intent);
  const payment = useAuthStore(state => state.payment);
  const logout = useAuthStore(state => state.logout);
  const loadWallet = useAuthStore(state => state.loadWallet);
  const createWallet = useAuthStore(state => state.createWallet);
  const createTopUp = useAuthStore(state => state.createTopUp);
  const showPayment = useAuthStore(state => state.showPayment);
  const resetIntent = useAuthStore(state => state.resetIntent);
  const reportError = useAuthStore(state => state.reportError);

  const topUpSchema = useMemo(() => {
    const max = config?.maxTopUpAmount || 100000;
    return z.object({
      amount: z
        .string()
        .trim()
        .min(1, 'Ingresá un importe.')
        .refine(
          val => parseAmount(val, max) !== null,
          `Ingresá un importe entre $0,01 y ${money(max)}, con hasta dos decimales.`
        ),
    });
  }, [config?.maxTopUpAmount]);

  const {
    register: registerTopUp,
    handleSubmit: handleTopUpSubmit,
    setValue: setTopUpValue,
    setError: setTopUpError,
    formState: { errors: topUpErrors },
  } = useForm({
    resolver: zodResolver(topUpSchema),
    mode: 'onTouched',
    values: {
      amount: intent ? String(intent.amount) : '',
    },
  });

  const {
    register: registerQuery,
    handleSubmit: handleQuerySubmit,
    setValue: setQueryValue,
    formState: { errors: queryErrors },
  } = useForm({
    resolver: zodResolver(querySchema),
    mode: 'onTouched',
    defaultValues: {
      queryId: payment?.id || '',
    },
  });

  useEffect(() => {
    if (intent?.amount !== undefined) {
      setTopUpValue('amount', String(intent.amount));
    }
  }, [intent, setTopUpValue]);

  useEffect(() => {
    if (payment?.id) {
      setQueryValue('queryId', payment.id);
    }
  }, [payment?.id, setQueryValue]);

  useEffect(() => {
    if (!session || !payment || !['Created', 'Pending', 'Unknown'].includes(payment.status)) return;
    const timer = setInterval(() => {
      showPayment(payment.id).catch(reportError);
    }, 5000);
    return () => clearInterval(timer);
  }, [session, payment?.id, payment?.status, showPayment, reportError]);

  async function onTopUpSubmit(values) {
    const parsed = parseAmount(values.amount, config.maxTopUpAmount);
    if (parsed === null) {
      setTopUpError('amount', {
        type: 'manual',
        message: `Ingresá un importe entre $0,01 y ${money(config.maxTopUpAmount)}, con hasta dos decimales.`,
      });
      return;
    }
    if (intent && intent.amount !== parsed) {
      setTopUpError('amount', {
        type: 'manual',
        message: 'Para cambiar el importe iniciá una nueva carga.',
      });
      return;
    }
    await createTopUp(parsed);
  }

  async function onQuerySubmit(values) {
    try {
      await showPayment(values.queryId);
    } catch (e) {
      reportError(e);
    }
  }

  function handleResetTopUp() {
    resetIntent();
    setTopUpValue('amount', '');
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Billetera virtual · entorno de pruebas</p>
          <h1>Mi billetera</h1>
        </div>
        {session && (
          <button className="secondary" onClick={logout} disabled={busy}>
            Cerrar sesión
          </button>
        )}
      </header>

      <p className="notice">
        Pruebas con Mercado Pago: usá exclusivamente cuentas y medios de pago de prueba. No se habilita dinero real.
      </p>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {session && (
        <>
          <section>
            <h2>Hola, {session.user.firstName}</h2>
            {wallet ? (
              <>
                <p className="balance font-mono">{money(wallet.balance)}</p>
                <p>Saldo disponible en ARS</p>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => loadWallet(session).catch(reportError)}
                >
                  Actualizar saldo
                </button>
              </>
            ) : (
              <>
                <p>Todavía no tenés una billetera.</p>
                <button disabled={busy} onClick={createWallet}>
                  Crear mi billetera
                </button>
              </>
            )}
          </section>

          <section>
            <h2>Cargar saldo</h2>
            {!config?.enabled ? (
              <p>Las cargas todavía no están habilitadas. Falta configurar Mercado Pago en el backend.</p>
            ) : (
              <>
                <p>Podés cargar hasta {money(config.maxTopUpAmount)} por operación.</p>
                <form onSubmit={handleTopUpSubmit(onTopUpSubmit)} noValidate>
                  <label>
                    Importe en ARS
                    <input
                      inputMode="decimal"
                      readOnly={!!intent}
                      placeholder="1000,00"
                      aria-invalid={!!topUpErrors.amount}
                      {...registerTopUp('amount')}
                    />
                  </label>
                  {topUpErrors.amount && (
                    <p role="alert" className="text-xs text-red-600 mt-1">
                      {topUpErrors.amount.message}
                    </p>
                  )}
                  <button disabled={busy || !wallet}>
                    {busy ? 'Procesando…' : intent ? 'Recuperar la misma carga' : 'Preparar carga'}
                  </button>
                  {intent && (
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={handleResetTopUp}
                    >
                      Iniciar otra carga
                    </button>
                  )}
                </form>
                <p className="muted">
                  Si hubo una demora, recuperá la misma carga antes de volver a pagar. Otra carga representa una operación diferente.
                </p>
              </>
            )}
          </section>

          {payment && (
            <section aria-live="polite">
              <h2>{statusText[payment.status] || 'Estado por consultar'}</h2>
              <p className="font-mono">{money(payment.amount)} · ARS</p>
              <p className="reference font-mono">Operación: {payment.id}</p>
              <p>
                {payment.status === 'Approved'
                  ? 'La acreditación fue confirmada por el backend.'
                  : 'El saldo se acredita únicamente después de verificar la aprobación con Mercado Pago.'}
              </p>
              {payment.requiresReview && (
                <p className="notice">
                  Esta operación necesita revisión. Conservá su identificador y evitá volver a pagar.
                </p>
              )}
              {payment.checkoutUrl &&
                safeCheckout(payment.checkoutUrl) &&
                ['Pending', 'Unknown'].includes(payment.status) && (
                  <a className="button" href={payment.checkoutUrl} target="_blank" rel="noopener noreferrer">
                    Abrir Mercado Pago de prueba
                  </a>
                )}
              <button
                className="secondary"
                disabled={busy}
                onClick={() => showPayment(payment.id, true).catch(reportError)}
              >
                Verificar con Mercado Pago
              </button>
            </section>
          )}

          {config?.enabled && (
            <section>
              <h2>Consultar una carga</h2>
              <form onSubmit={handleQuerySubmit(onQuerySubmit)} noValidate>
                <label>
                  Identificador de operación
                  <input
                    aria-invalid={!!queryErrors.queryId}
                    {...registerQuery('queryId')}
                  />
                </label>
                {queryErrors.queryId && (
                  <p role="alert" className="text-xs text-red-600 mt-1">
                    {queryErrors.queryId.message}
                  </p>
                )}
                <button disabled={busy}>Consultar estado</button>
              </form>
            </section>
          )}

          {wallet && (
            <section>
              <h2>Últimos movimientos</h2>
              {movements.length === 0 ? (
                <p>No hay movimientos registrados.</p>
              ) : (
                <ul className="movements">
                  {movements.map(m => (
                    <li key={m.id}>
                      <div>
                        <strong>
                          {m.type === 'Credit' ? 'Ingreso' : 'Salida'} · {money(m.amount)}
                        </strong>
                        <p>
                          {m.source === 'Payment'
                            ? 'Carga con Mercado Pago'
                            : m.source === 'Transfer'
                            ? 'Transferencia'
                            : 'Fondos de desarrollo'}
                        </p>
                        <time dateTime={m.createdAt} className="font-mono">
                          {new Date(m.createdAt).toLocaleString('es-AR')}
                        </time>
                      </div>
                      <span className="font-mono">Saldo: {money(m.balanceAfter)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      <footer>El regreso desde el checkout no confirma el pago. Consultá siempre el estado de tu operación.</footer>
    </main>
  );
}
