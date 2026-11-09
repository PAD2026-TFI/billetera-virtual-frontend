import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, LogIn, Wallet } from 'lucide-react';
import { primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
import { formatCurrency } from '@/lib/formatters';
import { routes } from '@/lib/routes';
import { hasActiveSession, useAuthStore } from '@/store/useAuthStore';
import { useWalletStore } from '@/store/useWalletStore';

export default function WalletPayment({ amount, onPay }) {
  const session = useAuthStore(state => state.session);
  const { summary, status, loadSummary } = useWalletStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [paying, setPaying] = useState(false);
  const signedIn = hasActiveSession(session);

  useEffect(() => {
    if (signedIn && status === 'idle') loadSummary();
  }, [signedIn, status, loadSummary]);

  if (!signedIn) {
    return (
      <div className="flex h-full flex-col justify-between gap-6 py-2">
        <div className="grid gap-4 rounded-2xl border border-[#ECE9F5] bg-[#F8F7FD] p-6 text-center dark:border-[#261E3D] dark:bg-[#1E1735]/60">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#4C1DB8] to-[#6C3BF4] text-[#FFD54A] shadow-md shadow-violet-500/20">
            <Wallet className="size-7" aria-hidden="true" />
          </span>
          <div className="grid gap-1.5">
            <h3 className="m-0 text-base font-bold text-[#1C1633] dark:text-[#F4F2FA]">Pagá directo con tu cuenta</h3>
            <p className="m-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">Ingresá a tu cuenta de padi. y pagá con tu saldo en un solo paso.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(routes.login, { state: { from: location } })}
          className={`${secondaryActionClass} inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold`}
        >
          <LogIn className="size-4.5" aria-hidden="true" />
          Iniciar sesión
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="grid h-52 place-items-center">
        <p aria-busy="true" className="m-0 flex items-center gap-2 text-sm text-[#4A4560] dark:text-[#9D97B5]">
          <Loader2 className="size-5 animate-spin text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
          Consultando tu saldo…
        </p>
      </div>
    );
  }

  const enoughBalance = summary.balance >= amount;

  async function pay() {
    setPaying(true);
    try {
      await onPay();
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="grid gap-4">
        <dl className="m-0 flex items-center justify-between gap-4 rounded-2xl border border-[#ECE9F5] bg-[#F8F7FD] p-5 dark:border-[#261E3D] dark:bg-[#1E1735]/60">
          <dt className="flex items-center gap-3 text-sm font-medium text-[#4A4560] dark:text-[#9D97B5]">
            <span className="grid size-10 place-items-center rounded-xl bg-[#4C1DB8]/10 text-[#4C1DB8] dark:bg-[#5B2EE0]/20 dark:text-[#FFD54A]">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
            Tu saldo disponible
          </dt>
          <dd className="m-0 font-mono text-2xl font-bold tracking-tight text-[#1C1633] dark:text-[#F4F2FA]">
            {formatCurrency(summary.balance)}
          </dd>
        </dl>

        {enoughBalance ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            <span>Tenés saldo suficiente. La acreditación al comercio es inmediata y sin costo adicional.</span>
          </div>
        ) : (
          <p role="alert" className="m-0 rounded-xl border border-amber-200 bg-[#FFF4CC] px-4 py-3 text-sm font-medium text-[#8A6100] dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
            Tu saldo no alcanza para este pago. Cargá saldo o pagá con tarjeta.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={pay}
        disabled={!enoughBalance || paying}
        className={`${primaryActionClass} inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold shadow-lg shadow-[#5B2EE0]/25 transition-all hover:shadow-[#5B2EE0]/40`}
      >
        {paying && <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />}
        {paying ? 'Procesando pago…' : `Pagar ${formatCurrency(amount)} con mi saldo`}
      </button>
    </div>
  );
}
