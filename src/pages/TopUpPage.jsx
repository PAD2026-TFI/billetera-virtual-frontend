import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Wallet } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import Field from '@/components/forms/Field';
import MoneyInput from '@/components/forms/MoneyInput';
import ResultCard from '@/components/common/ResultCard';
import { primaryActionClass, secondaryActionClass, sectionTitleClass } from '@/components/forms/formStyles';
import { formatCurrency } from '@/lib/formatters';
import { parseMoney } from '@/lib/money';
import { routes } from '@/lib/routes';
import { TOP_UP_LIMIT } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

const presets = [5000, 10000, 20000, 50000];

const steps = [
  'Elegís cuánto querés cargar.',
  'Pagás en el checkout de prueba de Mercado Pago.',
  'Cuando Mercado Pago confirma, el saldo aparece en tu cuenta.',
];

function TopUpContent({ summary }) {
  const navigate = useNavigate();
  const { topUp, confirmTopUp } = useWalletStore();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('form');
  const [operation, setOperation] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const amount = parseMoney(value);
    if (amount === null) return setError('Ingresá un monto con números y hasta dos decimales.');
    if (amount > TOP_UP_LIMIT) return setError(`El máximo por carga es ${formatCurrency(TOP_UP_LIMIT)}.`);
    setError('');
    setPhase('creating');
    const pending = await topUp(amount);
    setOperation(pending);
    setPhase('pending');
    setOperation(await confirmTopUp(pending.id));
    setPhase('approved');
  }

  if (phase === 'pending' || phase === 'approved') {
    const approved = phase === 'approved';
    return (
      <div className={`mx-auto max-w-lg ${panelClass}`}>
        <ResultCard
          tone={approved ? 'success' : 'pending'}
          title={approved ? 'Saldo acreditado' : 'Esperando la confirmación de Mercado Pago'}
          amount={formatCurrency(operation.amount)}
          rows={[
            { label: 'Medio', value: 'Mercado Pago (prueba)' },
            { label: 'Estado', value: approved ? 'Acreditado' : 'Pendiente' },
            { label: 'Número de operación', value: operation.id, mono: true },
            ...(approved ? [{ label: 'Saldo actual', value: formatCurrency(summary.balance), mono: true }] : []),
          ]}
        >
          {approved ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => { setPhase('form'); setValue(''); setOperation(null); }} className={secondaryActionClass}>Cargar otra vez</button>
              <button type="button" onClick={() => navigate(routes.home)} className={primaryActionClass}>Volver al inicio</button>
            </div>
          ) : (
            <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">No vuelvas a pagar: apenas se confirme, lo vas a ver acá.</p>
          )}
        </ResultCard>
      </div>
    );
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <form onSubmit={submit} noValidate className={`m-0 grid max-w-none gap-5 ${panelClass}`}>
        <h2 className={sectionTitleClass}>¿Cuánto querés cargar?</h2>
        <Field id="top-up-amount" label="Monto" error={error} hint={`Hasta ${formatCurrency(TOP_UP_LIMIT)} por carga.`}>
          <MoneyInput id="top-up-amount" value={value} onChange={event => setValue(event.target.value)} aria-invalid={!!error} />
        </Field>
        <div role="group" aria-label="Montos sugeridos" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => { setValue(String(preset)); setError(''); }}
              aria-pressed={parseMoney(value) === preset}
              className={`m-0 h-11 rounded-full border-0 font-mono text-sm font-semibold ${parseMoney(value) === preset ? 'bg-[#4C1DB8] text-white dark:bg-[#5B2EE0]' : 'bg-[#F3F1F9] text-[#4C1DB8] hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#B9A6FF]'}`}
            >
              {formatCurrency(preset).replace(',00', '')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#009EE3] text-white">
            <Wallet className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="m-0 text-sm font-semibold">Mercado Pago</p>
            <p className="m-0 text-xs text-[#8C87A3] dark:text-[#9D97B5]">Entorno de pruebas, sin dinero real</p>
          </div>
        </div>
        {phase === 'creating' && <p className="sr-only" role="status">Preparando la carga</p>}
        <button type="submit" disabled={phase === 'creating'} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
          {phase === 'creating' && <Loader2 className="size-4 animate-spin" />}
          {phase === 'creating' ? 'Preparando…' : 'Continuar a Mercado Pago'}
        </button>
        {summary.recentMovements.some(m => m.kind === 'topUp' && m.status === 'pending') && (
          <p className="m-0 rounded-xl bg-[#FFF4CC] px-4 py-3 text-sm text-[#8A6100] dark:bg-amber-950/40 dark:text-amber-300">
            Tenés una carga pendiente. Revisá su estado en Movimientos antes de pagar otra vez.
          </p>
        )}
      </form>

      <section aria-labelledby="how-title" className={`m-0 grid gap-4 border-0 ${panelClass}`}>
        <h2 id="how-title" className={sectionTitleClass}>Cómo funciona</h2>
        <ol className="m-0 grid list-none gap-4 p-0">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E6DFFB] font-mono text-sm font-semibold text-[#4C1DB8] dark:bg-[#281F45] dark:text-[#B9A6FF]">{index + 1}</span>
              <p className="m-0 pt-1 text-sm text-[#4A4560] dark:text-[#9D97B5]">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default function TopUpPage() {
  return (
    <AppLayout header={() => <PageHeader title="Cargar saldo" subtitle="Sumá dinero a tu cuenta desde Mercado Pago." />}>
      {summary => <TopUpContent summary={summary} />}
    </AppLayout>
  );
}
