import { useMemo } from 'react';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Field from '@/components/forms/Field';
import MoneyInput from '@/components/forms/MoneyInput';
import { fieldInputClass, primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
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
      .refine(value => parseMoneyInput(value) <= TRANSFER_LIMIT, `Supera el límite por transferencia de ${formatCurrency(TRANSFER_LIMIT)}.`)
      .refine(value => parseMoneyInput(value) <= balance, `Supera tu saldo disponible de ${formatCurrency(balance)}.`),
    reason: z.enum(transferReasons),
  });

const pillClass =
  'm-0 h-10 shrink-0 rounded-full border-0 bg-[#F3F1F9] px-4 font-mono text-sm font-semibold text-[#4C1DB8] hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#B9A6FF] dark:hover:bg-[#281F45]';

export default function AmountStep({ balance, draft, onBack, onContinue }) {
  const resolver = useMemo(() => zodResolver(amountSchema(balance)), [balance]);
  const { control, register, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm({
    resolver,
    mode: 'onChange',
    defaultValues: { amount: draft ? toMoneyInput(draft.amount) : '', reason: draft?.reason ?? transferReasons[0] },
  });
  const { field: amountField } = useController({ name: 'amount', control });
  const amount = parseMoneyInput(watch('amount')) ?? 0;
  const choose = value => setValue('amount', toMoneyInput(value), { shouldValidate: true });

  return (
    <form
      onSubmit={handleSubmit(values => onContinue({ amount: parseMoneyInput(values.amount), reason: values.reason }))}
      noValidate
      className="m-0 grid max-w-none gap-5"
    >
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

      <div role="group" aria-label="Montos rápidos" className="-mt-2 flex gap-2 overflow-x-auto pb-1">
        {presetAmounts.map(value => (
          <button key={value} type="button" onClick={() => choose(value)} className={pillClass}>
            {formatCurrency(value).replace(',00', '')}
          </button>
        ))}
        <button type="button" onClick={() => choose(Math.min(balance, TRANSFER_LIMIT))} className={`${pillClass} font-[Poppins]`}>
          Transferir todo el saldo
        </button>
      </div>

      <dl className="m-0 grid grid-cols-2 gap-3 rounded-2xl bg-[#F8F7FD] p-4 text-sm dark:bg-[#1E1735]">
        <div>
          <dt className="text-[#8C87A3] dark:text-[#9D97B5]">Disponible</dt>
          <dd className="m-0 font-mono font-semibold">{formatCurrency(balance)}</dd>
        </div>
        <div>
          <dt className="text-[#8C87A3] dark:text-[#9D97B5]">Te quedarían</dt>
          <dd className={`m-0 font-mono font-semibold ${amount > balance ? 'text-red-600 dark:text-rose-300' : ''}`}>{formatCurrency(balance - amount)}</dd>
        </div>
      </dl>

      <Field id="reason" label="Motivo">
        <select id="reason" className={`${fieldInputClass} w-full appearance-none`} {...register('reason')}>
          {transferReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
        </select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onBack} className={secondaryActionClass}>Volver</button>
        <button type="submit" disabled={!isValid} className={primaryActionClass}>Continuar</button>
      </div>
    </form>
  );
}
