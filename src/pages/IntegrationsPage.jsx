import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, KeyRound, Plug, RefreshCw, ShieldCheck } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import { api, API_BASE } from '@/services/api';
import { isMerchantUser, useAuthStore } from '@/store/useAuthStore';
import { routes } from '@/lib/routes';

const endpoint = '/api/v1/me/merchant/integration';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B2EE0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';
const secondary = 'rounded-xl border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-800 dark:border-violet-700 dark:text-violet-200 disabled:opacity-50';
const date = value => value ? new Date(value).toLocaleString('es-AR') : '—';

export function IntegrationsContent() {
  const user = useAuthStore(state => state.session?.user);
  const token = useAuthStore(state => state.session?.token);
  const [integration, setIntegration] = useState(null);
  const [name, setName] = useState('');
  const [secret, setSecret] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const merchant = isMerchantUser(user);
  const active = integration?.status === 'Active';

  useEffect(() => {
    const controller = new AbortController();
    setSecret(null); setIntegration(null); setError(''); setLoading(true);
    if (!merchant) { setLoading(false); return () => controller.abort(); }
    api(endpoint, { signal: controller.signal }).then(setIntegration).catch(e => {
      if (e.name !== 'AbortError') setError(e.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, merchant]);

  async function refresh() {
    setBusy(true); setError('');
    try { setIntegration(await api(endpoint)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function mutate(action) {
    setBusy(true); setError(''); setNotice(''); setSecret(null); setConfirmation(null);
    try {
      const result = await api(action === 'rotate' ? `${endpoint}/rotate` : endpoint, {
        method: action === 'revoke' ? 'DELETE' : 'POST',
        ...(action === 'create' ? { body: { name: name.trim() } } : {}),
      });
      setIntegration(result.integration ?? result);
      if (result.apiKey) setSecret(result.apiKey);
      else setNotice('Clave revocada. Tu sistema ya no puede operar con ella.');
    } catch (e) {
      setError(`${e.message} Consultá el estado antes de volver a intentar. Si hay una clave activa que no pudiste guardar, reemplazala.`);
      // A timeout may happen after a successful write. Never repeat key issuance automatically.
      try { setIntegration(await api(endpoint)); } catch { /* Keep original actionable error. */ }
    } finally { setBusy(false); }
  }

  if (!merchant) return <section className={panelClass}><h2 className="text-lg font-bold">Activá tu perfil de vendedor</h2><p>Para integrar tu sistema de cobros, activá la modalidad Vendedor en Mi perfil. Conservás tu misma cuenta y billetera.</p><Link to={routes.profile} className={button}>Ir a Mi perfil</Link></section>;

  return <div className="grid gap-6 lg:grid-cols-2">
    <section className={`${panelClass} min-w-0`}>
      <h2 className="flex items-center gap-2 text-lg font-bold"><Plug className="size-5" /> Integración de tu comercio</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Conectá tu tienda o sistema para generar links de pago. Los cobros llegan a la misma billetera que usás en Padi.</p>
      {error && <p role="alert" className="my-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
      {notice && <p role="status" className="my-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{notice}</p>}
      {loading ? <p role="status">Consultando integración…</p> : <>
        <dl className="my-5 grid gap-3 text-sm">
          <div><dt className="text-zinc-500">Estado</dt><dd className="font-semibold">{active ? 'Activa' : integration?.status === 'Revoked' ? 'Revocada' : 'Sin activar'}</dd></div>
          {integration?.name && <div><dt className="text-zinc-500">Nombre</dt><dd>{integration.name}</dd></div>}
          {integration?.keyPrefix && <div><dt className="text-zinc-500">Clave enmascarada</dt><dd className="break-all font-mono">{integration.keyPrefix}••••••••••••</dd></div>}
          {integration?.createdAt && <div><dt className="text-zinc-500">Creación</dt><dd>{date(integration.createdAt)}</dd></div>}
          {integration?.lastRotatedAt && <div><dt className="text-zinc-500">Última generación</dt><dd>{date(integration.lastRotatedAt)}</dd></div>}
          {integration?.revokedAt && <div><dt className="text-zinc-500">Revocación</dt><dd>{date(integration.revokedAt)}</dd></div>}
        </dl>
        {integration && !active && <form className="grid gap-3" onSubmit={e => { e.preventDefault(); mutate('create'); }}>
          <label className="grid gap-1 text-sm font-medium">Nombre de la integración<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Mi tienda online" className="rounded-xl border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600" /></label>
          <button disabled={busy || !name.trim()} className={button}><KeyRound className="size-4" />Generar API Key</button>
        </form>}
        {active && <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => setConfirmation('rotate')} className={secondary}>Reemplazar clave</button><button type="button" disabled={busy} onClick={() => setConfirmation('revoke')} className={secondary}>Revocar clave</button></div>}
        <button type="button" disabled={busy} onClick={refresh} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-200"><RefreshCw className="size-4" />Actualizar estado</button>
      </>}
      {confirmation && <div role="alertdialog" aria-labelledby="integration-confirm-title" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950">
        <h3 id="integration-confirm-title" className="font-bold">{confirmation === 'rotate' ? '¿Reemplazar la clave?' : '¿Revocar la clave?'}</h3>
        <p className="my-2 text-sm">La clave actual deja de funcionar inmediatamente. {confirmation === 'rotate' ? 'Guardá la nueva y actualizala en tu sistema.' : 'Los cobros ya creados se conservan. Para volver a conectar tu sistema tendrás que generar otra clave.'}</p>
        <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy} onClick={() => mutate(confirmation)}>{confirmation === 'rotate' ? 'Confirmar reemplazo' : 'Confirmar revocación'}</button><button type="button" className={secondary} onClick={() => setConfirmation(null)}>Cancelar</button></div>
      </div>}
      {secret && <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:bg-amber-950">
        <h3 className="font-bold">Guardá tu API Key ahora</h3><p className="my-2 text-sm">Solo se muestra en esta respuesta. Al salir o cerrar este panel no podrás recuperarla.</p>
        <code data-testid="issued-api-key" className="block break-all rounded-lg bg-white p-3 text-sm text-zinc-900">{secret}</code>
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} onClick={async () => { try { await navigator.clipboard.writeText(secret); setNotice('Clave copiada. Guardala de forma segura.'); } catch { setNotice('No se pudo copiar. Seleccioná y guardá la clave antes de cerrar.'); } }}><Copy className="size-4" />Copiar clave</button><button type="button" className={secondary} onClick={() => { setSecret(null); setNotice('La clave ya no se mostrará. Si no la guardaste, reemplazala.'); }}>Ya la guardé</button></div>
      </div>}
    </section>
    <section className={`${panelClass} min-w-0`}>
      <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5" /> Cómo conectar tu sistema</h2>
      <ol className="my-4 list-decimal space-y-3 pl-5 text-sm"><li>Generá una clave y guardala en el servidor de tu tienda.</li><li>Enviá la clave en <code>X-Api-Key</code> para crear enlaces y consultar cobros.</li><li>Redirigí al comprador al <code>checkoutUrl</code> recibido.</li><li>Confirmá el pago consultando los cobros recibidos y verificando el estado <code>Succeeded</code>, el importe y el enlace del pedido.</li></ol>
      <p className="mb-3 text-sm">La clave permite crear y consultar cobros de tu cuenta. No permite transferir saldo ni administrar tu perfil o tus claves.</p>
      <p className="mb-4 rounded-xl bg-violet-50 p-3 text-sm dark:bg-violet-950">Nunca publiques la clave en el código del navegador, URLs o repositorios. La app administra tus claves con tu sesión; el sistema externo las utiliza desde su servidor.</p>
      <details><summary className="cursor-pointer font-semibold">Ejemplo para el servidor de tu tienda</summary><pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100"><code>{`curl '${API_BASE}/api/v1/integrations/payment-links' \\\n  -H "X-Api-Key: $PADI_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  --data '{"amount":1500,"title":"Pedido 1042","type":"SingleUse"}'`}</code></pre>
      <p className="mt-3 text-sm">Guardá el <code>id</code> del enlace junto al pedido. Consultá <code className="break-all">GET /api/v1/integrations/received-payments</code> y buscá el pago por <code>paymentLinkId</code>.</p><p className="mt-2 text-sm">La creación de enlaces no deduplica reintentos. Ante un timeout, no generes otro automáticamente sin revisar el resultado. El listado de cobros devuelve los más recientes; no es un historial paginado.</p></details>
      <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-violet-700 dark:text-violet-200"><Link to={routes.collections}>Ver mis cobros</Link><Link to={routes.profile}>Mi perfil</Link></div>
    </section>
  </div>;
}

export default function IntegrationsPage() {
  return <AppLayout header={() => <PageHeader title="Integraciones" />}>
    {() => <IntegrationsContent />}
  </AppLayout>;
}
