import { useEffect, useState } from 'react';
import { api, money, parseAmount, safeCheckout, saveIntent, readIntent } from '@/services/api';
import { useAuthStore, useSignOut } from '@/store/useAuthStore';

const statusText = { Created: 'Preparando carga', Unknown: 'Resultado por confirmar', Pending: 'Pago pendiente',
  Approved: 'Saldo acreditado', Rejected: 'Pago rechazado', Cancelled: 'Pago cancelado', Error: 'No se pudo iniciar el pago' };
export default function SandboxPage() {
  const session = useAuthStore(state => state.session);
  const signOut = useSignOut();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState(null);
  const [config, setConfig] = useState(null);
  const [movements, setMovements] = useState([]);
  const [amount, setAmount] = useState('');
  const [intent, setIntent] = useState(null);
  const [payment, setPayment] = useState(null);
  const [queryId, setQueryId] = useState('');

  function report(e) {
    setError(e.message || 'No pudimos comunicarnos con la API. Conservá la carga para reintentar.');
  }
  async function loadWallet() {
    try {
      const w = await api('/api/wallets/me');
      const history = await api('/api/wallets/me/movements?limit=20');
      setWallet(w); setMovements(history.items);
    } catch (e) { if (e.code === 'WALLET_NOT_FOUND') setWallet(null); else throw e; }
  }
  async function showPayment(id, refresh = false) {
    if (!id) return;
    const p = await api(`/api/payments/${encodeURIComponent(id)}${refresh ? '/refresh' : ''}`,
      { method: refresh ? 'POST' : 'GET' });
    setPayment(p); setQueryId(p.id);
    if (p.status === 'Approved') await loadWallet();
  }
  useEffect(() => {
    run(async () => {
      setConfig(await api('/api/payments/config'));
      await loadWallet();
      const saved = readIntent(session.user.id); setIntent(saved); setAmount(saved ? String(saved.amount) : '');
      if (saved?.paymentId) await showPayment(saved.paymentId);
    });
  }, [session]);
  useEffect(() => {
    if (!payment || !['Created', 'Pending', 'Unknown'].includes(payment.status)) return;
    const timer = setInterval(() => showPayment(payment.id).catch(report), 5000);
    return () => clearInterval(timer);
  }, [payment?.id, payment?.status]);

  async function run(action) { setBusy(true); setError(''); try { await action(); } catch (e) { report(e); } finally { setBusy(false); } }
  async function start(event) {
    event.preventDefault();
    await run(async () => {
      const parsed = parseAmount(amount, config.maxTopUpAmount);
      if (parsed === null) throw new Error(`Ingresá un importe entre $0,01 y ${money(config.maxTopUpAmount)}, con hasta dos decimales.`);
      if (intent && intent.amount !== parsed) throw new Error('Para cambiar el importe iniciá una nueva carga.');
      const current = intent || { key: crypto.randomUUID(), amount: parsed };
      saveIntent(session.user.id, current); setIntent(current);
      const p = await api('/api/payments', { key: current.key, method: 'POST', body: { amount: current.amount } });
      saveIntent(session.user.id, { ...current, paymentId: p.id });
      setIntent({ ...current, paymentId: p.id }); setPayment(p); setQueryId(p.id);
      if (p.status === 'Approved') await loadWallet();
    });
  }
  return <main className="sandbox-main">
    <header><div><p className="eyebrow">Billetera virtual · entorno de pruebas</p><h1>Mi billetera</h1></div>
      <button className="secondary" onClick={signOut} disabled={busy}>Cerrar sesión</button></header>
    <p className="notice">Pruebas con Mercado Pago: usá exclusivamente cuentas y medios de pago de prueba. No se habilita dinero real.</p>
    {error && <p role="alert" className="error">{error}</p>}
      <section><h2>Hola, {session.user.firstName}</h2>
        {wallet ? <><p className="balance">{money(wallet.balance)}</p><p>Saldo disponible en ARS</p>
          <button className="secondary" disabled={busy} onClick={() => run(() => loadWallet())}>Actualizar saldo</button></>
          : <><p>Todavía no tenés una billetera.</p><button disabled={busy} onClick={() => run(async () => {
            await api('/api/wallets', { method: 'POST' }); await loadWallet();
          })}>Crear mi billetera</button></>}
      </section>
      <section><h2>Cargar saldo</h2>
        {!config?.enabled ? <p>Las cargas todavía no están habilitadas. Falta configurar Mercado Pago en el backend.</p> : <>
          <p>Podés cargar hasta {money(config.maxTopUpAmount)} por operación.</p>
          <form onSubmit={start}><label>Importe en ARS<input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
            required readOnly={!!intent} placeholder="1000,00"/></label>
            <button disabled={busy || !wallet}>{busy ? 'Procesando…' : intent ? 'Recuperar la misma carga' : 'Preparar carga'}</button>
            {intent && <button type="button" className="secondary" disabled={busy} onClick={() => {
              sessionStorage.removeItem(`wallet-payment:${session.user.id}`); setIntent(null); setPayment(null); setAmount('');
            }}>Iniciar otra carga</button>}
          </form><p className="muted">Si hubo una demora, recuperá la misma carga antes de volver a pagar. Otra carga representa una operación diferente.</p>
        </>}
      </section>
      {payment && <section aria-live="polite"><h2>{statusText[payment.status] || 'Estado por consultar'}</h2>
        <p>{money(payment.amount)} · ARS</p><p className="reference">Operación: {payment.id}</p>
        <p>{payment.status === 'Approved' ? 'La acreditación fue confirmada por el backend.' :
          'El saldo se acredita únicamente después de verificar la aprobación con Mercado Pago.'}</p>
        {payment.requiresReview && <p className="notice">Esta operación necesita revisión. Conservá su identificador y evitá volver a pagar.</p>}
        {payment.checkoutUrl && safeCheckout(payment.checkoutUrl) && ['Pending', 'Unknown'].includes(payment.status)
          && <a className="button" href={payment.checkoutUrl} target="_blank" rel="noopener noreferrer">Abrir Mercado Pago de prueba</a>}
        <button className="secondary" disabled={busy} onClick={() => run(() => showPayment(payment.id, true))}>Verificar con Mercado Pago</button>
      </section>}
      {config?.enabled && <section><h2>Consultar una carga</h2><form onSubmit={e => { e.preventDefault(); run(() => showPayment(queryId)); }}>
        <label>Identificador de operación<input value={queryId} onChange={e => setQueryId(e.target.value)} required/></label>
        <button disabled={busy}>Consultar estado</button></form></section>}
      {wallet && <section><h2>Últimos movimientos</h2>{movements.length === 0 ? <p>No hay movimientos registrados.</p> :
        <ul className="movements">{movements.map(m => <li key={m.id}><div><strong>{m.type === 'Credit' ? 'Ingreso' : 'Salida'} · {money(m.amount)}</strong>
          <p>{m.source === 'Payment' ? 'Carga con Mercado Pago' : m.source === 'Transfer' ? 'Transferencia' : 'Fondos de desarrollo'}</p>
          <time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString('es-AR')}</time></div><span>Saldo: {money(m.balanceAfter)}</span></li>)}</ul>}</section>}
    <footer>El regreso desde el checkout no confirma el pago. Consultá siempre el estado de tu operación.</footer>
  </main>;
}
