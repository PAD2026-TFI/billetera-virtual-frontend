import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import Field from '@/components/forms/Field';
import MoneyInput from '@/components/forms/MoneyInput';
import {
  alertClass,
  fieldInputClass,
  primaryActionClass,
  secondaryActionClass,
  sectionTitleClass,
} from '@/components/forms/formStyles';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money';
import { api } from '@/services/api';
import { isLiveSession } from '@/services/mocks/walletService';
import { useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';

export default function CollectionsPage() {
  const { summary } = useWalletStore();
  const sessionUser = useAuthStore(state => state.session?.user);

  const [amountInput, setAmountInput] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeLink, setActiveLink] = useState(null);
  const [linksList, setLinksList] = useState([]);
  const [copiedToken, setCopiedToken] = useState(null);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    async function loadLinks() {
      if (!isLiveSession()) return;
      setLoadingList(true);
      try {
        const res = await api('/api/v1/me/merchant/payment-links');
        if (Array.isArray(res)) setLinksList(res);
      } catch {
        // silent fail for non-blocking list
      } finally {
        setLoadingList(false);
      }
    }
    loadLinks();
  }, []);

  async function handleCreateCollection(e) {
    e.preventDefault();
    const amount = parseMoneyInput(amountInput);
    if (!amount || amount <= 0) {
      setError('Ingresá un importe válido mayor a cero.');
      return;
    }
    if (!title.trim()) {
      setError('Ingresá un título o concepto para el cobro.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      if (isLiveSession()) {
        const res = await api('/api/v1/me/merchant/payment-links', {
          method: 'POST',
          body: {
            amount,
            title: title.trim(),
            description: description.trim() || undefined,
            type: 'SingleUse',
            currency: 'ARS',
          },
        });
        setActiveLink(res);
        setLinksList(prev => [res, ...prev]);
      } else {
        const token = `mch-${Math.random().toString(36).slice(2, 10)}`;
        const mockLink = {
          id: crypto.randomUUID(),
          token,
          title: title.trim(),
          description: description.trim() || undefined,
          amount,
          currency: 'ARS',
          status: 'Active',
          createdAt: new Date().toISOString(),
          checkoutUrl: `${window.location.origin}/checkout?token=${token}`,
        };
        setActiveLink(mockLink);
        setLinksList(prev => [mockLink, ...prev]);
      }
      setAmountInput('');
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err?.message || 'No pudimos generar el link de cobro. Reintentá.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink(token) {
    const url = `${window.location.origin}/checkout?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      setCopiedToken(null);
    }
  }

  const qrImageUrl = activeLink
    ? isLiveSession()
      ? `https://localhost:7081/api/v1/public/payment-links/${activeLink.token}/qr`
      : null
    : null;

  return (
    <AppLayout
      header={
        <PageHeader
          title="Cobros y Ventas"
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD54A]/25 px-2.5 py-0.5 text-xs font-semibold text-[#7A5400] ring-1 ring-inset ring-[#E5B822]/40 dark:bg-[#FFD54A]/15 dark:text-[#FFD54A] dark:ring-[#FFD54A]/30">
              <Store className="size-3.5 stroke-[2.2]" />
              Comercio activo
            </span>
          }
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <section className={`lg:col-span-5 ${panelClass} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-2 text-[#4C1DB8] dark:text-[#FFD54A]">
              <Sparkles className="size-5" />
              <h2 className={sectionTitleClass}>Nuevo cobro</h2>
            </div>
            <p className="mt-1 text-xs text-[#6E6888] dark:text-[#9D97B5]">
              Generá un link de pago con código QR dinámico para cobrar a tus clientes.
            </p>

            {error && (
              <p role="alert" className={`mt-3 ${alertClass}`}>
                {error}
              </p>
            )}

            <form onSubmit={handleCreateCollection} noValidate className="mt-4 grid gap-3.5">
              <Field id="collection-amount" label="Importe a cobrar">
                <MoneyInput
                  id="collection-amount"
                  value={amountInput}
                  onChange={e => setAmountInput(formatMoneyInput(e.target.value))}
                  placeholder="0,00"
                />
              </Field>

              <Field id="collection-title" label="Concepto o producto">
                <input
                  id="collection-title"
                  type="text"
                  maxLength={100}
                  placeholder="Ej. Remera oversize, Café especial..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={`${fieldInputClass} h-11 w-full bg-white px-4 dark:bg-[#120D20]`}
                />
              </Field>

              <Field id="collection-description" label="Detalle adicional (opcional)">
                <input
                  id="collection-description"
                  type="text"
                  maxLength={160}
                  placeholder="Ej. Talle L, Color Negro, Mesa 4"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`${fieldInputClass} h-11 w-full bg-white px-4 dark:bg-[#120D20]`}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className={`${primaryActionClass} mt-2 inline-flex items-center justify-center gap-2`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generando cobro…
                  </>
                ) : (
                  <>
                    <QrCode className="size-4" />
                    Generar link y QR
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] p-3.5 text-xs text-[#6E6888] dark:border-[#261E3D] dark:bg-[#19122C] dark:text-[#9D97B5]">
            <p className="m-0 flex items-center gap-2 font-semibold text-[#1C1633] dark:text-white">
              <ShieldCheck className="size-4 text-emerald-500" />
              Acreditación inmediata
            </p>
            <p className="mt-1 mb-0 text-[11px] leading-relaxed">
              Los pagos recibidos se acreditan al instante en el saldo disponible de tu billetera padi.
            </p>
          </div>
        </section>

        <section className={`lg:col-span-7 ${panelClass} flex flex-col gap-5`}>
          {activeLink ? (
            <div className="rounded-[24px] border border-[#5B2EE0]/30 bg-gradient-to-b from-[#FAF8FE] to-white p-5 text-center shadow-lg shadow-purple-950/5 dark:border-[#5B2EE0]/40 dark:from-[#1E1735] dark:to-[#140F24]">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Esperando pago del cliente
              </div>

              <p className="m-0 mt-3 font-mono text-[32px] font-bold text-[#1C1633] dark:text-white">
                {formatCurrency(activeLink.amount)}
              </p>
              <p className="m-0 mt-1 text-sm font-semibold text-[#4C1DB8] dark:text-[#C4B2FF]">
                {activeLink.title}
              </p>
              {activeLink.description && (
                <p className="m-0 mt-0.5 text-xs text-[#6E6888] dark:text-[#9D97B5]">
                  {activeLink.description}
                </p>
              )}

              <div className="mx-auto my-4 grid size-52 place-items-center rounded-2xl border border-[#ECE9F5] bg-white p-3 shadow-md dark:border-[#261E3D] dark:bg-white">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Código QR de cobro"
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-2 text-center text-[#1C1633]">
                    <QrCode className="size-28 text-[#4C1DB8]" />
                    <span className="font-mono text-[10px] text-[#6E6888]">
                      {activeLink.token}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => copyLink(activeLink.token)}
                  className={`${secondaryActionClass} inline-flex items-center justify-center gap-2`}
                >
                  {copiedToken === activeLink.token ? (
                    <>
                      <Check className="size-4 text-emerald-500" />
                      ¡Link copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copiar link
                    </>
                  )}
                </button>

                <a
                  href={`/checkout?token=${activeLink.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}
                >
                  <ExternalLink className="size-4" />
                  Abrir checkout
                </a>
              </div>
            </div>
          ) : (
            <div className="grid place-items-center rounded-[24px] border border-dashed border-[#DFD9F0] bg-[#FAF9FE] p-8 text-center dark:border-[#2C2247] dark:bg-[#161028]">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#EDE7FC] text-[#5B2EE0] dark:bg-[#281F45] dark:text-[#FFD54A]">
                <QrCode className="size-7" />
              </span>
              <h3 className="m-0 mt-3 text-sm font-bold text-[#1C1633] dark:text-white">
                Todavía no generaste un cobro
              </h3>
              <p className="mt-1 mb-0 max-w-xs text-xs text-[#8C87A3] dark:text-[#7E7699]">
                Ingresá el importe y el concepto a la izquierda para generar tu primer link de pago y código QR dinámico.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <h3 className="m-0 text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
                Cobros generados recientemente
              </h3>
              <span className="rounded-full bg-[#F3F1F9] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#FFD54A]">
                {linksList.length}
              </span>
            </div>

            {loadingList ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto size-5 animate-spin text-[#5B2EE0]" />
              </div>
            ) : linksList.length === 0 ? (
              <p className="mt-3 text-xs text-[#8C87A3] dark:text-[#7E7699]">
                No tenés historial de cobros aún.
              </p>
            ) : (
              <ul className="m-0 mt-3 grid list-none gap-2.5 p-0">
                {linksList.slice(0, 10).map(link => {
                  const isPaid = link.status === 'Paid' || link.status === 'Completed';
                  return (
                    <li
                      key={link.id || link.token}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#ECE9F5] bg-white p-3.5 transition-colors hover:border-[#5B2EE0]/30 dark:border-[#261E3D] dark:bg-[#19122C]"
                    >
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-semibold text-[#1C1633] dark:text-white">
                          {link.title}
                        </p>
                        <p className="m-0 mt-0.5 text-[11px] text-[#8C87A3] dark:text-[#6E6888]">
                          {formatDateTime(link.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="m-0 font-mono text-sm font-bold text-[#1C1633] dark:text-white">
                            {formatCurrency(link.amount)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              isPaid
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            {isPaid ? 'Cobrado' : 'Activo'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyLink(link.token)}
                            aria-label="Copiar link"
                            className="grid size-9 place-items-center rounded-xl bg-[#F3F1F9] text-[#4C1DB8] transition-colors hover:bg-[#E9E5F6] dark:bg-[#231A3D] dark:text-[#FFD54A] dark:hover:bg-[#2B204A]"
                          >
                            {copiedToken === link.token ? (
                              <Check className="size-4 text-emerald-500" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveLink(link)}
                            aria-label="Ver código QR"
                            className="grid size-9 place-items-center rounded-xl bg-[#F3F1F9] text-[#4C1DB8] transition-colors hover:bg-[#E9E5F6] dark:bg-[#231A3D] dark:text-[#FFD54A] dark:hover:bg-[#2B204A]"
                          >
                            <QrCode className="size-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
