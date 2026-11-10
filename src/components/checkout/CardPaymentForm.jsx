import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, FlaskConical, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Field from '@/components/forms/Field';
import { fieldInputClass, primaryActionClass } from '@/components/forms/formStyles';
import { formatCardNumber, formatExpiry, isExpired, isValidLuhn, onlyDigits } from '@/lib/cards';
import { formatCurrency } from '@/lib/formatters';
import { testCards } from '@/services/mocks/checkoutService';
import CardPreview from './CardPreview';

const cardSchema = z
  .object({
    number: z.string().refine(value => onlyDigits(value).length === 16 && isValidLuhn(value), 'Revisá el número de la tarjeta.'),
    holder: z.string().trim().min(3, 'Ingresá el nombre como figura en la tarjeta.'),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usá el formato MM/AA.').refine(value => !isExpired(value), 'La tarjeta está vencida.'),
    cvv: z.string().regex(/^\d{3}$/, 'Revisá el código de seguridad.'),
  });

const inputClass = `${fieldInputClass} font-mono h-11 rounded-xl`;

export default function CardPaymentForm({ amount, onPay }) {
  const [flipped, setFlipped] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(cardSchema),
    mode: 'onTouched',
    defaultValues: { number: '', holder: '', expiry: '', cvv: '' },
  });
  const card = watch();
  const formatted = (name, format) => register(name, { onChange: event => setValue(name, format(event.target.value)) });

  function fillTestCard(testCard) {
    const options = { shouldValidate: true };
    setValue('number', testCard.number, options);
    setValue('holder', 'Titular de prueba', options);
    setValue('expiry', '12/30', options);
    setValue('cvv', testCard.cvv, options);
  }

  return (
    <form onSubmit={handleSubmit(onPay)} noValidate className="m-0 flex flex-col gap-4">
      <p className="m-0 text-sm">Ingresá los datos de tu tarjeta virtual desde Mi tarjeta en Padi.</p>
      <div className="grid gap-4">
        <CardPreview number={card.number} holder={card.holder} expiry={card.expiry} cvv={card.cvv} flipped={flipped} />

        {import.meta.env.MODE === 'test' && (
          <details className="rounded-2xl border border-[#ECE9F5] bg-[#F8F7FD] text-sm dark:border-[#261E3D] dark:bg-[#1E1735]/60">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between px-4 font-semibold text-[#4C1DB8] dark:text-[#B9A6FF]">
              <span className="flex items-center gap-2">
                <FlaskConical className="size-4" aria-hidden="true" />
                Tarjetas de prueba
              </span>
              <span className="text-xs font-normal text-[#8C87A3] dark:text-[#9D97B5]">Simulador sandbox</span>
            </summary>
            <div className="grid gap-2 border-t border-[#ECE9F5] p-3 dark:border-[#261E3D]">
              <p className="m-0 text-xs text-[#4A4560] dark:text-[#9D97B5]">Es un simulador: nunca ingreses los datos de una tarjeta real.</p>
              <div className="grid gap-1.5">
                {testCards.map(testCard => (
                  <button
                    key={testCard.label}
                    type="button"
                    onClick={() => fillTestCard(testCard)}
                    className="m-0 flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[#ECE9F5] bg-white px-3 text-left transition-colors hover:bg-[#E9E5F6] dark:border-[#261E3D] dark:bg-[#140F24] dark:hover:bg-[#281F45]"
                  >
                    <span className="text-xs font-semibold text-[#1C1633] dark:text-[#F4F2FA]">{testCard.label}</span>
                    <span className="font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">{testCard.number}</span>
                  </button>
                ))}
              </div>
            </div>
          </details>
        )}

        <div className="grid gap-3.5">
          <Field id="card-number" label="Número de tarjeta" error={errors.number}>
            <Input id="card-number" inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000" className={inputClass} aria-invalid={!!errors.number} {...formatted('number', formatCardNumber)} />
          </Field>
          <Field id="card-holder" label="Nombre del titular" error={errors.holder}>
            <Input id="card-holder" autoComplete="off" placeholder="Como figura en la tarjeta" className={`${fieldInputClass} h-11 rounded-xl uppercase`} aria-invalid={!!errors.holder} {...register('holder')} />
          </Field>
          <div className="grid grid-cols-2 gap-3.5">
            <Field id="card-expiry" label="Vencimiento" error={errors.expiry}>
              <Input id="card-expiry" inputMode="numeric" autoComplete="off" placeholder="MM/AA" className={inputClass} aria-invalid={!!errors.expiry} {...formatted('expiry', formatExpiry)} />
            </Field>
            <Field id="card-cvv" label="Código de seguridad" error={errors.cvv}>
              <Input
                id="card-cvv"
                inputMode="numeric"
                autoComplete="off"
                placeholder="CVV"
                maxLength={3}
                className={inputClass}
                aria-invalid={!!errors.cvv}
                onFocus={() => setFlipped(true)}
                {...register('cvv', { onBlur: () => setFlipped(false), onChange: event => setValue('cvv', onlyDigits(event.target.value)) })}
              />
            </Field>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`${primaryActionClass} inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold shadow-lg shadow-[#5B2EE0]/25 transition-all hover:shadow-[#5B2EE0]/40`}
      >
        {isSubmitting ? <Loader2 className="size-4.5 animate-spin" aria-hidden="true" /> : <CreditCard className="size-4.5" aria-hidden="true" />}
        {isSubmitting ? 'Procesando pago…' : `Pagar ${formatCurrency(amount)}`}
      </button>
    </form>
  );
}
