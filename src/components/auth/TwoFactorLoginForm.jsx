import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconInput } from './IconInput.jsx';
import { alertClass, inputClass, labelClass, primaryButtonClass } from './styles.js';

const codeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Ingresá los 6 números que muestra tu app.'),
});

export default function TwoFactorLoginForm({ onSubmit, onBack, busy, error }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(codeSchema),
    mode: 'onTouched',
  });

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Volver
      </button>
      <h1 className="m-0 text-[26px] font-bold tracking-tight text-[#2A0E7A] lg:text-[30px]">Verificación en dos pasos</h1>
      <p className="mt-1 mb-5 text-sm text-[#8C87A3] lg:mb-6">Abrí tu app de autenticación e ingresá el código de 6 números de padi.</p>

      <form onSubmit={handleSubmit(values => onSubmit(values.code))} noValidate className="m-0 grid max-w-none gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="two-factor-code" className={labelClass}>Código de verificación</Label>
          <IconInput
            icon={ShieldCheck}
            id="two-factor-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            autoFocus
            className={`${inputClass} font-mono tracking-[0.3em]`}
            aria-invalid={!!errors.code}
            {...register('code')}
          />
          {errors.code && (
            <p role="alert" className="m-0 text-xs text-red-600">
              {errors.code.message}
            </p>
          )}
        </div>

        {error && <p role="alert" className={alertClass}>{error}</p>}

        <Button type="submit" disabled={busy} className={`${primaryButtonClass} mt-2`}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? 'Verificando…' : 'Verificar e ingresar'}
        </Button>
      </form>
    </div>
  );
}
