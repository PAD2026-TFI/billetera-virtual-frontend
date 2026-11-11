import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, KeyRound, Link2, Plug, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import {
  alertClass,
  fieldInputClass,
  primaryActionClass,
  secondaryActionClass,
  sectionTitleClass,
} from '@/components/forms/formStyles';
import { api, API_BASE } from '@/services/api';
import { isMerchantUser, useAuthStore } from '@/store/useAuthStore';
import { routes } from '@/lib/routes';

const endpoint = '/api/v1/me/merchant/integration';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B2EE0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';
const secondary = 'rounded-xl border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-800 dark:border-violet-700 dark:text-violet-200 disabled:opacity-50';
const codeClass = 'rounded-md bg-[#F3F1F9] px-1.5 py-0.5 font-mono text-[0.85em] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#C4B2FF]';
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
  const [copied, setCopied] = useState('');
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

  async function copyText(key, text) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1800); }
    catch { setCopied(''); }
  }

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

  if (!merchant) {
    return (
      <section className={`${panelClass} flex flex-col items-start gap-3`}>
        <h2 className={sectionTitleClass}>Activá tu perfil de vendedor</h2>
        <p className="m-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">Para integrar tu sistema de cobros, activá la modalidad Vendedor en Mi perfil. Conservás tu misma cuenta y billetera.</p>
        <Link to={routes.profile} className={`${button} no-underline`}>Ir a Mi perfil</Link>
      </section>
    );
  }

  const revoked = integration?.status === 'Revoked';
  const statusLabel = active ? 'Activa' : revoked ? 'Revocada' : 'Sin activar';
  const statusTone = active
    ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300'
    : revoked
      ? 'bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:bg-rose-400/15 dark:text-rose-300'
      : 'bg-[#F3F1F9] text-[#6E6888] ring-[#DFD9F0] dark:bg-[#1E1735] dark:text-[#9D97B5] dark:ring-[#2C2247]';
  const dotTone = active ? 'bg-emerald-500' : revoked ? 'bg-rose-500' : 'bg-[#ABA6C2]';
  const details = [
    integration?.name && ['Nombre', integration.name, false],
    integration?.keyPrefix && ['Clave enmascarada', `${integration.keyPrefix}••••••••••••`, true],
    integration?.createdAt && ['Creación', date(integration.createdAt), false],
    integration?.lastRotatedAt && ['Última generación', date(integration.lastRotatedAt), false],
    integration?.revokedAt && ['Revocación', date(integration.revokedAt), false],
  ].filter(Boolean);
  const steps = [
    <>Generá una clave y guardala en el servidor de tu tienda.</>,
    <>Enviá la clave en <code className={codeClass}>X-Api-Key</code> para crear enlaces y consultar cobros.</>,
    <>Redirigí al comprador al <code className={codeClass}>checkoutUrl</code> recibido.</>,
    <>Confirmá el pago consultando los cobros recibidos y verificando el estado <code className={codeClass}>Succeeded</code>, el importe y el enlace del pedido.</>,
  ];
  const curlExample = `curl '${API_BASE}/api/v1/integrations/payment-links' \\\n  -H "X-Api-Key: $PADI_API_KEY" \\\n  -H 'Content-Type: application/json' \\\n  --data '{"amount":1500,"title":"Pedido 1042","type":"SingleUse"}'`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
      <section className={`${panelClass} flex min-w-0 flex-col gap-5`}>
        <header className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#C4B2FF]">
            <Plug className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className={`${sectionTitleClass} tracking-tight`}>Integración de tu comercio</h2>
            <p className="m-0 mt-1 text-sm leading-relaxed text-[#6E6888] dark:text-[#9D97B5]">Conectá tu tienda o sistema para generar links de pago. Los cobros llegan a la misma billetera que usás en Padi.</p>
          </div>
        </header>

        {error && <p role="alert" className={alertClass}>{error}</p>}
        {notice && <p role="status" className="m-0 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">{notice}</p>}

        {loading ? <p role="status" className="m-0 text-sm text-[#6E6888] dark:text-[#9D97B5]">Consultando integración…</p> : <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[#DFD9F0] bg-white/60 px-4 py-3 text-sm dark:border-[#2C2247] dark:bg-[#140F24]/60">
            <span className="flex min-w-0 items-center gap-2.5"><Link2 className="size-4 shrink-0 text-[#4C1DB8] dark:text-[#C4B2FF]" aria-hidden="true" /><span className="min-w-0"><span className="block text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">URL base de la API</span><span className="block truncate font-mono text-xs text-[#1C1633] dark:text-[#F4F2FA]">{API_BASE}</span></span></span>
            <button type="button" onClick={() => copyText('base', API_BASE)} aria-label="Copiar URL base" className="m-0 grid size-9 shrink-0 place-items-center rounded-full border border-[#ECE9F5] bg-white p-0 text-[#4C1DB8] hover:bg-[#F3F1F9] dark:border-[#261E3D] dark:bg-[#1E1735] dark:text-[#C4B2FF]">{copied === 'base' ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}</button>
          </div>

          <dl className="m-0 divide-y divide-[#ECE9F5] rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] px-4 text-sm dark:divide-[#251C3D] dark:border-[#261E3D] dark:bg-[#19122C]">
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-[#6E6888] dark:text-[#9D97B5]">Estado</dt>
              <dd className="m-0">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone}`}>
                  <span className={`size-1.5 rounded-full ${dotTone}`} aria-hidden="true" />{statusLabel}
                </span>
              </dd>
            </div>
            {details.map(([label, value, mono]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3">
                <dt className="shrink-0 text-[#6E6888] dark:text-[#9D97B5]">{label}</dt>
                <dd className={`m-0 min-w-0 break-all text-right font-semibold text-[#1C1633] dark:text-[#F4F2FA] ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
              </div>
            ))}
          </dl>

          {integration && !active && (
            <form className="grid gap-3" onSubmit={e => { e.preventDefault(); mutate('create'); }}>
              <label className="grid gap-1.5 text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
                Nombre de la integración
                <input required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Mi tienda online" className={`${fieldInputClass} w-full text-sm font-normal tracking-normal normal-case`} />
              </label>
              <button disabled={busy || !name.trim()} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
                <KeyRound className="size-4" aria-hidden="true" />Generar API Key
              </button>
            </form>
          )}

          {active && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={busy} onClick={() => setConfirmation('rotate')} className={secondaryActionClass}>Reemplazar clave</button>
              <button type="button" disabled={busy} onClick={() => setConfirmation('revoke')} className={`${secondaryActionClass} text-rose-600 hover:text-rose-700 dark:text-rose-300`}>Revocar clave</button>
            </div>
          )}

          <button type="button" disabled={busy} onClick={refresh} className="m-0 inline-flex items-center gap-2 self-start border-0 bg-transparent p-0 text-sm font-semibold text-[#4C1DB8] hover:underline disabled:opacity-50 dark:text-[#C4B2FF]">
            <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />Actualizar estado
          </button>
        </>}

        {confirmation && (
          <div role="alertdialog" aria-labelledby="integration-confirm-title" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/40">
            <h3 id="integration-confirm-title" className="m-0 font-bold">{confirmation === 'rotate' ? '¿Reemplazar la clave?' : '¿Revocar la clave?'}</h3>
            <p className="my-2 text-sm">La clave actual deja de funcionar inmediatamente. {confirmation === 'rotate' ? 'Guardá la nueva y actualizala en tu sistema.' : 'Los cobros ya creados se conservan. Para volver a conectar tu sistema tendrás que generar otra clave.'}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={busy} onClick={() => mutate(confirmation)}>{confirmation === 'rotate' ? 'Confirmar reemplazo' : 'Confirmar revocación'}</button>
              <button type="button" className={secondary} onClick={() => setConfirmation(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {secret && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/40">
            <h3 className="m-0 font-bold">Guardá tu API Key ahora</h3>
            <p className="my-2 text-sm">Solo se muestra en esta respuesta. Al salir o cerrar este panel no podrás recuperarla.</p>
            <code data-testid="issued-api-key" className="block break-all rounded-lg bg-white p-3 text-sm text-zinc-900">{secret}</code>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={button} onClick={async () => { try { await navigator.clipboard.writeText(secret); setNotice('Clave copiada. Guardala de forma segura.'); } catch { setNotice('No se pudo copiar. Seleccioná y guardá la clave antes de cerrar.'); } }}><Copy className="size-4" aria-hidden="true" />Copiar clave</button>
              <button type="button" className={secondary} onClick={() => { setSecret(null); setNotice('La clave ya no se mostrará. Si no la guardaste, reemplazala.'); }}>Ya la guardé</button>
            </div>
          </div>
        )}
      </section>


      <section className={`${panelClass} flex min-w-0 flex-col gap-5`}>
        <header className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FFD54A]/25 text-[#7A5400] dark:bg-[#FFD54A]/15 dark:text-[#FFD54A]">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <h2 className={`${sectionTitleClass} tracking-tight`}>Cómo conectar tu sistema</h2>
        </header>

        <ol className="m-0 grid list-none gap-0 p-0 text-sm leading-relaxed text-[#2B2540] dark:text-[#D9D5E8]">
          {steps.map((step, i) => (
            <li key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
              {i < steps.length - 1 && <span className="absolute top-7 bottom-0 left-3 w-px bg-[#DFD9F0] dark:bg-[#2C2247]" aria-hidden="true" />}
              <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#4C1DB8] text-xs font-bold text-white dark:bg-[#5B2EE0]" aria-hidden="true">{i + 1}</span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </ol>

        <p className="m-0 flex items-start gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Nunca publiques la clave en el código del navegador, URLs o repositorios. La app administra tus claves con tu sesión; el sistema externo las utiliza desde su servidor.</span>
        </p>

        <details className="rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] p-4 dark:border-[#261E3D] dark:bg-[#19122C]">
          <summary className="cursor-pointer font-semibold text-[#1C1633] dark:text-[#F4F2FA]">Ejemplo para el servidor de tu tienda</summary>
          <div className="relative mt-3">
            <button type="button" onClick={() => copyText('curl', curlExample)} className="m-0 absolute top-2 right-2 inline-flex h-8 items-center gap-1.5 rounded-full border-0 bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20">{copied === 'curl' ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}{copied === 'curl' ? 'Copiado' : 'Copiar ejemplo'}</button>
            <pre className="custom-scrollbar m-0 overflow-x-auto rounded-xl bg-zinc-950 p-4 pt-12 text-xs text-zinc-100"><code>{curlExample}</code></pre>
          </div>
          <p className="mt-3 text-sm">Guardá el <code className={codeClass}>id</code> del enlace junto al pedido. Consultá <code className={`${codeClass} break-all`}>GET /api/v1/integrations/received-payments</code> y buscá el pago por <code className={codeClass}>paymentLinkId</code>.</p>
          <p className="mt-2 text-sm">La creación de enlaces no deduplica reintentos. Ante un timeout, no generes otro automáticamente sin revisar el resultado. El listado de cobros devuelve los más recientes; no es un historial paginado.</p>
        </details>

      </section>
    </div>
  );
}

export default function IntegrationsPage() {
  return <AppLayout header={() => <PageHeader title="Integraciones" />}>
    {() => <IntegrationsContent />}
  </AppLayout>;
}
