import { useMemo } from 'react';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Sparkles, User } from 'lucide-react';
import Field from '@/components/forms/Field';
import MoneyInput from '@/components/forms/MoneyInput';
import CustomSelect from '@/components/ui/CustomSelect';
import { primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
import { formatCurrency } from '@/lib/formatters';
import { formatMoneyInput, parseMoneyInput, toMoneyInput } from '@/lib/money';
import { TRANSFER_LIMIT } from '@/services/mocks/walletService';

export const transferReasons = ['Varios', 'Alquiler', 'Factura', 'Servicios'];
const presetAmounts = [5000, 10000, 20000, 50000];

const amountSchema = balance =>
  z.object({
    amount: z
      .string()
      .refine(value => parseMoneyInput(value) !== null, 'Ingresá un monto válido, por ejemplo 1.500,50.')
      .refine(
        value => parseMoneyInput(value) <= TRANSFER_LIMIT,
        `Supera el límite por transferencia de ${formatCurrency(TRANSFER_LIMIT)}.`
      )
      .refine(
        value => parseMoneyInput(value) <= balance,
        `Supera tu saldo disponible de ${formatCurrency(balance)}.`
      ),
    reason: z.enum(transferReasons),
  });

export default function AmountStep({ balance, draft, recipient, onBack, onContinue }) {
  const resolver = useMemo(() => zodResolver(amountSchema(balance)), [balance]);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver,
    mode: 'onChange',
    defaultValues: {
      amount: draft ? toMoneyInput(draft.amount) : '',
      reason: draft?.reason ?? transferReasons[0],
    },
  });
  const { field: amountField } = useController({ name: 'amount', control });
  const rawWatch = watch('amount');
  const amount = parseMoneyInput(rawWatch) ?? 0;
  const remaining = balance - amount;
  const choose = value => setValue('amount', toMoneyInput(value), { shouldValidate: true });

  return (
    <form
      onSubmit={handleSubmit(values =>
        onContinue({ amount: parseMoneyInput(values.amount), reason: values.reason })
      )}
      noValidate
      className="m-0 flex min-h-0 flex-1 flex-col justify-between gap-5 animate-page-enter"
    >
      <div className="grid gap-4">
        {recipient && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] p-3 transition-colors dark:border-[#261E3D] dark:bg-[#19122C]">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#4C1DB8]/10 font-mono text-sm font-bold text-[#4C1DB8] dark:bg-[#5B2EE0]/20 dark:text-[#FFD54A]">
                {(recipient.name || recipient.alias || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="m-0 truncate text-[11px] font-semibold text-[#8C87A3] uppercase tracking-wider dark:text-[#6B6485]">
                  Destinatario
                </p>
                <p className="m-0 truncate text-sm font-bold text-[#1C1633] dark:text-[#F4F2FA]">
                  {recipient.name}
                </p>
                <p className="m-0 truncate font-mono text-xs text-[#6E6888] dark:text-[#9D97B5]">
                  {recipient.bank} • {recipient.alias || recipient.destination}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="m-0 shrink-0 rounded-full border border-[#ECE9F5] bg-white px-3 py-1 text-xs font-semibold text-[#4C1DB8] shadow-sm transition-colors hover:bg-[#F3F1F9] dark:border-[#261E3D] dark:bg-[#140F24] dark:text-[#FFD54A] dark:hover:bg-[#1E1735]"
            >
              Cambiar
            </button>
          </div>
        )}

        <Field id="amount" label="Monto" error={errors.amount}>
          <MoneyInput
            id="amount"
            ref={amountField.ref}
            name={amountField.name}
            value={amountField.value}
            onBlur={amountField.onBlur}
            onChange={event => amountField.onChange(formatMoneyInput(event.target.value))}
            aria-invalid={!!errors.amount}
          />
        </Field>

        <div
          role="group"
          aria-label="Montos rápidos"
          className="flex flex-wrap items-center gap-2"
        >
          {presetAmounts.map(value => {
            const isSelected = amount === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => choose(value)}
                className={`m-0 h-9 shrink-0 rounded-full border px-3.5 font-mono text-xs font-semibold transition-all duration-150 ${
                  isSelected
                    ? 'border-[#5B2EE0] bg-[#FAF8FE] text-[#5B2EE0] ring-1 ring-[#5B2EE0]/30 dark:border-[#FFD54A] dark:bg-[#1E1735] dark:text-[#FFD54A]'
                    : 'border-[#ECE9F5] bg-white text-[#4A4560] hover:border-[#5B2EE0]/40 hover:text-[#5B2EE0] dark:border-[#261E3D] dark:bg-[#19122C] dark:text-[#9D97B5] dark:hover:border-[#5B2EE0]/60 dark:hover:text-[#F4F2FA]'
                }`}
              >
                {formatCurrency(value).replace(',00', '')}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => choose(Math.min(balance, TRANSFER_LIMIT))}
            className="m-0 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#FFD54A]/60 bg-[#FFF9E5] px-3.5 font-[Poppins] text-xs font-semibold text-[#7A5400] transition-colors hover:bg-[#FFF3CC] dark:border-[#FFD54A]/30 dark:bg-[#2A2010] dark:text-[#FFD54A] dark:hover:bg-[#342814]"
          >
            <Sparkles className="size-3" aria-hidden="true" />
            Transferir todo el saldo
          </button>
        </div>

        <dl className="m-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] p-4 text-xs dark:border-[#261E3D] dark:bg-[#19122C]">
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
              Disponible
            </dt>
            <dd className="m-0 mt-0.5 truncate font-mono text-base font-bold text-[#1C1633] tabular-nums dark:text-[#F4F2FA]">
              {formatCurrency(balance)}
            </dd>
          </div>

          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#FFD54A]"
          >
            <ArrowRight className="size-4" />
          </span>

          <div className="min-w-0 text-right">
            <dt className="text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
              Te quedarían
            </dt>
            <dd
              className={`m-0 mt-0.5 truncate font-mono text-base font-bold tabular-nums ${
                remaining < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(remaining)}
            </dd>
          </div>
        </dl>

        <Field id="reason" label="Motivo">
          <CustomSelect id="reason" {...register('reason')}>
            {transferReasons.map(reason => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </CustomSelect>
        </Field>
      </div>

      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        <button type="button" onClick={onBack} className={secondaryActionClass}>
          Volver
        </button>
        <button type="submit" disabled={!isValid} className={primaryActionClass}>
          Continuar
        </button>
      </div>
    </form>
  );
}
