import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconInput, PasswordInput } from './IconInput.jsx';
import { alertClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './styles.js';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu correo electrónico.')
    .email('El formato del correo no es válido.')
    .max(254, 'Máximo 254 caracteres.'),
  password: z
    .string()
    .min(1, 'Ingresá tu contraseña.')
    .max(128, 'Máximo 128 caracteres.'),
});

export default function LoginForm({ onSubmit, busy, error, onCreateAccount, onForgotPassword }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  function handleFormSubmit(values) {
    if (onSubmit) {
      onSubmit(values);
    }
  }

  return (
    <div>
      <h1 className="m-0 text-[26px] font-bold tracking-tight text-[#2A0E7A] lg:text-[30px]">Iniciar sesión</h1>
      <p className="mt-1 mb-5 text-sm text-[#8C87A3] lg:mb-6">Qué bueno verte de nuevo.</p>

      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="m-0 grid max-w-none gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="login-email" className={labelClass}>Correo electrónico</Label>
          <IconInput
            icon={Mail}
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder="nombre@correo.com"
            className={inputClass}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p role="alert" className="m-0 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className={labelClass}>Contraseña</Label>
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="m-0 cursor-pointer border-0 bg-transparent p-0 text-[12px] font-medium text-[#5B2EE0] shadow-none transition-colors hover:bg-transparent hover:text-[#3D1499] hover:underline focus:outline-none"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
          <PasswordInput
            icon={Lock}
            id="login-password"
            autoComplete="current-password"
            placeholder="Ingresá tu contraseña"
            className={inputClass}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p role="alert" className="m-0 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && <p role="alert" className={alertClass}>{error}</p>}

        <Button type="submit" disabled={busy} className={`${primaryButtonClass} mt-2`}>
          {busy && <Loader2 className="animate-spin" />}
          {busy ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>

      <Divider />

      <Button type="button" onClick={onCreateAccount} disabled={busy} className={secondaryButtonClass}>
        Crear una cuenta
      </Button>
    </div>
  );
}

export function Divider() {
  return (
    <div className="my-2.5 flex items-center gap-3 text-xs text-[#ABA6C2] lg:my-3">
      <span className="h-px flex-1 bg-[#ECE9F5]" />o<span className="h-px flex-1 bg-[#ECE9F5]" />
    </div>
  );
}
