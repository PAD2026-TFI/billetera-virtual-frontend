import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, LogIn, Wallet } from 'lucide-react';
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
      <div className="grid gap-4 text-sm text-[#4A4560] dark:text-[#9D97B5]">
        <p className="m-0">Ingresá a tu cuenta de padi. y pagá con tu saldo en un solo paso.</p>
        <button type="button" onClick={() => navigate(routes.login, { state: { from: location } })} className={`${secondaryActionClass} inline-flex items-center justify-center gap-2`}>
          <LogIn className="size-4" aria-hidden="true" />
          Iniciar sesión
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <p aria-busy="true" className="m-0 flex items-center gap-2 text-sm text-[#4A4560] dark:text-[#9D97B5]">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Consultando tu saldo…
      </p>
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
    <div className="grid gap-4">
      <dl className="m-0 flex items-center justify-between gap-4 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
        <dt className="flex items-center gap-2 text-sm text-[#8C87A3] dark:text-[#9D97B5]">
          <Wallet className="size-4" aria-hidden="true" />
          Tu saldo disponible
        </dt>
        <dd className="m-0 font-mono text-lg font-semibold">{formatCurrency(summary.balance)}</dd>
      </dl>
      {!enoughBalance && (
        <p role="alert" className="m-0 rounded-xl bg-[#FFF4CC] px-4 py-3 text-sm text-[#8A6100] dark:bg-amber-950/40 dark:text-amber-300">
          Tu saldo no alcanza para este pago. Cargá saldo o pagá con tarjeta.
        </p>
      )}
      <button type="button" onClick={pay} disabled={!enoughBalance || paying} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
        {paying && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {paying ? 'Procesando pago…' : `Pagar ${formatCurrency(amount)} con mi saldo`}
      </button>
    </div>
  );
}
