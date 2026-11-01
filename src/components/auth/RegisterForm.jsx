import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { api } from '@/api';
import { IconInput, PasswordInput } from './IconInput.jsx';
import { Divider } from './LoginForm.jsx';
import { alertClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './styles.js';

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Ingresá tu nombre.').max(100, 'Máximo 100 caracteres.'),
    lastName: z.string().trim().min(1, 'Ingresá tu apellido.').max(100, 'Máximo 100 caracteres.'),
    email: z.string().trim().min(1, 'Ingresá tu correo.').email('El correo no es válido.').max(254, 'Máximo 254 caracteres.'),
    password: z.string().min(12, 'Mínimo 12 caracteres.').max(128, 'Máximo 128 caracteres.'),
    confirmPassword: z.string().min(1, 'Repetí la contraseña.'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export default function RegisterForm({ onRegistered, onCancel }) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });
  const passwordLongEnough = (watch('password') || '').length >= 12;

  async function onSubmit(values) {
    setServerError('');
    const { confirmPassword, ...body } = values;
    try {
      const user = await api('/api/users', { method: 'POST', body });
      onRegistered?.(user, { email: values.email, password: values.password });
    } catch (error) {
      if (error.code === 'EMAIL_ALREADY_REGISTERED') setServerError('Ese correo ya tiene una cuenta.');
      else if (error.status === 429) setServerError('Hiciste demasiados intentos. Esperá un momento.');
      else if (error.status === 400) setServerError('Revisá los datos ingresados.');
      else setServerError('No pudimos crear la cuenta. Intentá de nuevo más tarde.');
    }
  }

  return (
    <div>
      <h1 className="m-0 text-[28px] font-bold tracking-tight text-[#2A0E7A]">Crear cuenta</h1>
      <p className="mt-1 mb-5 text-sm text-[#8C87A3]">Es gratis y te lleva un minuto.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="m-0 grid max-w-none gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field id="firstName" label="Nombre" error={errors.firstName}>
            <IconInput icon={User} id="firstName" autoComplete="given-name" className={inputClass} aria-invalid={!!errors.firstName} {...register('firstName')} />
          </Field>
          <Field id="lastName" label="Apellido" error={errors.lastName}>
            <IconInput icon={User} id="lastName" autoComplete="family-name" className={inputClass} aria-invalid={!!errors.lastName} {...register('lastName')} />
          </Field>
        </div>

        <Field id="email" label="Correo electrónico" error={errors.email}>
          <IconInput icon={Mail} id="email" type="email" autoComplete="email" placeholder="nombre@correo.com" className={inputClass} aria-invalid={!!errors.email} {...register('email')} />
        </Field>

        <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-3">
          <Field
            id="password"
            label="Contraseña"
            error={errors.password}
            hint={
              <span className={`flex items-center gap-1.5 ${passwordLongEnough ? 'text-emerald-600' : ''}`}>
                <Check className="size-3.5" /> Mínimo 12 caracteres
              </span>
            }
          >
            <PasswordInput icon={Lock} id="password" autoComplete="new-password" placeholder="Ingresá tu contraseña" className={inputClass} aria-invalid={!!errors.password} {...register('password')} />
          </Field>

          <Field id="confirmPassword" label="Repetir contraseña" error={errors.confirmPassword}>
            <PasswordInput icon={Lock} id="confirmPassword" autoComplete="new-password" placeholder="Repetí tu contraseña" className={inputClass} aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
          </Field>
        </div>

        {serverError && <p role="alert" className={alertClass}>{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} mt-1`}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>

      {onCancel && (
        <>
          <Divider />
          <Button type="button" onClick={onCancel} disabled={isSubmitting} className={secondaryButtonClass}>
            Ya tengo cuenta
          </Button>
        </>
      )}
    </div>
  );
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id} className={labelClass}>{label}</Label>
      {children}
      {error ? (
        <p className="m-0 text-xs text-red-600">{error.message}</p>
      ) : (
        hint && <div className="text-xs text-[#ABA6C2]">{hint}</div>
      )}
    </div>
  );
}
