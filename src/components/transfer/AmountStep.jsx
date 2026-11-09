import { useMemo } from 'react';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Sparkles } from 'lucide-react';
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

const pillClass =
  'm-0 h-9 shrink-0 rounded-full border border-[#ECE9F5] bg-[#FAF9FE] px-3.5 font-mono text-xs font-semibold text-[#4C1DB8] transition-all hover:border-[#4C1DB8]/35 hover:bg-[#EDE7FC] dark:border-[#2C2247] dark:bg-[#19122C] dark:text-[#C4B2FF] dark:hover:border-[#5B2EE0]/50 dark:hover:bg-[#241B3E]';

export default function AmountStep({ balance, draft, onBack, onContinue }) {
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
  const amount = parseMoneyInput(watch('amount')) ?? 0;
  const remaining = balance - amount;
  const choose = value => setValue('amount', toMoneyInput(value), { shouldValidate: true });

  return (
    <form
      onSubmit={handleSubmit(values =>
        onContinue({ amount: parseMoneyInput(values.amount), reason: values.reason })
      )}
      noValidate
      className="m-0 flex min-h-0 flex-1 flex-col justify-between gap-4 animate-page-enter"
    >
      <div className="grid gap-3.5">
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
          className="-mt-1 flex flex-wrap items-center gap-2 pb-1"
        >
          {presetAmounts.map(value => (
            <button key={value} type="button" onClick={() => choose(value)} className={pillClass}>
              {formatCurrency(value).replace(',00', '')}
            </button>
          ))}
          <button
            type="button"
            onClick={() => choose(Math.min(balance, TRANSFER_LIMIT))}
            className="m-0 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#E5B822]/45 bg-[#FFD54A]/25 px-3.5 font-[Poppins] text-xs font-semibold text-[#7A5400] transition-colors hover:bg-[#FFD54A]/40 dark:border-[#FFD54A]/30 dark:bg-[#FFD54A]/15 dark:text-[#FFD54A] dark:hover:bg-[#FFD54A]/25"
          >
            <Sparkles className="size-3" aria-hidden="true" />
            Transferir todo el saldo
          </button>
        </div>

        <dl className="m-0 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-[#ECE9F5] bg-gradient-to-r from-[#FAF9FE] via-white to-[#F5F2FC] p-3.5 text-xs dark:border-[#2C2247] dark:from-[#19122C] dark:via-[#161028] dark:to-[#1E1535]">
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
              Disponible
            </dt>
            <dd className="m-0 mt-0.5 truncate font-mono text-sm font-bold text-[#1C1633] tabular-nums dark:text-[#F4F2FA]">
              {formatCurrency(balance)}
            </dd>
          </div>

          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#FFD54A]"
          >
            <ArrowRight className="size-3.5" />
          </span>

          <div className="min-w-0 text-right">
            <dt className="text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
              Te quedarían
            </dt>
            <dd
              className={`m-0 mt-0.5 truncate font-mono text-sm font-bold tabular-nums ${
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

      <div className="grid gap-2.5 pt-2 sm:grid-cols-2">
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
