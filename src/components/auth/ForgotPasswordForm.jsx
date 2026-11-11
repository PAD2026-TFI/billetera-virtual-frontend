import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/services/api';
import { cn } from 'cn';
import { IconInput, PasswordInput } from './IconInput.jsx';
import { RequirementItem } from './RegisterForm.jsx';
import { alertClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './styles.js';

const emptyCode = ['', '', '', '', '', ''];

const unavailableCodes = ['HTTP_401', 'HTTP_404', 'HTTP_405', 'PASSWORD_RESET_UNAVAILABLE'];
const unavailableMessage = 'La recuperación de contraseña no está disponible en este momento. Probá de nuevo más tarde.';

const describeError = (error, fallback) =>
  unavailableCodes.includes(error?.code) ? unavailableMessage : error?.message || fallback;

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu correo electrónico.')
    .email('El formato del correo no es válido.')
    .max(254, 'Máximo 254 caracteres.'),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres.')
      .max(128, 'Máximo 128 caracteres.')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula.')
      .regex(/[a-z]/, 'Debe incluir al menos una minúscula.')
      .regex(/[0-9]/, 'Debe incluir al menos un número.'),
    confirmPassword: z.string().min(1, 'Repetí tu contraseña.'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

const backLinkClass =
  'mb-4 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] shadow-none transition-colors hover:bg-transparent hover:text-[#3D1499] focus:outline-none';

export default function ForgotPasswordForm({ onBack }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(emptyCode);
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);
  const codeRefs = useRef([]);

  const emailForm = useForm({ resolver: zodResolver(emailSchema), mode: 'onTouched' });
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = passwordForm.watch('password') || '';
  const confirmPassword = passwordForm.watch('confirmPassword') || '';
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const codeComplete = code.join('').length === 6;
  const isResetting = passwordForm.formState.isSubmitting;

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setInterval(() => setCountdown(value => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (step === 'reset') codeRefs.current[0]?.focus();
  }, [step]);

  async function requestCode(destination) {
    setServerError('');
    setIsSending(true);
    try {
      const response = await api('/api/v1/auth/password-reset', {
        method: 'POST',
        token: null,
        body: { email: destination },
      });
      setEmail(destination);
      setCode(emptyCode);
      setCountdown(response?.retryAfterSeconds ?? 60);
      setNotice('Si el correo tiene una cuenta en padi., te va a llegar un código.');
      setStep('reset');
    } catch (error) {
      setServerError(describeError(error, 'No pudimos enviar el código. Reintentá en unos minutos.'));
    } finally {
      setIsSending(false);
    }
  }

  async function resetPassword(values) {
    if (!codeComplete) {
      setServerError('Ingresá los 6 dígitos del código.');
      return;
    }
    setServerError('');
    try {
      await api('/api/v1/auth/password-reset/confirm', {
        method: 'POST',
        token: null,
        body: { email, code: code.join(''), newPassword: values.password },
      });
      setDone(true);
    } catch (error) {
      if (error.code === 'PASSWORD_RESET_CODE_INVALID') {
        setCode(emptyCode);
        codeRefs.current[0]?.focus();
      }
      setServerError(error.fieldErrors?.newPassword || describeError(error, 'No pudimos cambiar la contraseña.'));
    }
  }

  function changeEmail() {
    setStep('email');
    setNotice('');
    setServerError('');
    setCode(emptyCode);
    passwordForm.reset();
  }

  function handleCodeChange(index, value) {
    const digits = value.replace(/\D/g, '');
    const replacing = code[index] && digits.length === 2;
    if (digits.length > 1 && !replacing) {
      const next = [...code];
      digits.slice(0, 6 - index).split('').forEach((digit, offset) => (next[index + offset] = digit));
      setCode(next);
      codeRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    const digit = replacing ? digits.replace(code[index], '') || code[index] : digits;
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) codeRefs.current[index + 1]?.focus();
  }

  function handleCodeKeyDown(index, event) {
    if (event.key === 'Backspace' && !code[index] && index > 0) codeRefs.current[index - 1]?.focus();
    else if (event.key === 'ArrowLeft' && index > 0) codeRefs.current[index - 1]?.focus();
    else if (event.key === 'ArrowRight' && index < 5) codeRefs.current[index + 1]?.focus();
  }

  function handleCodePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    setCode(emptyCode.map((_, index) => pasted[index] || ''));
    codeRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  const errorBox = serverError && (
    <p role="alert" className={cn(alertClass, 'flex items-center gap-2.5')}>
      <AlertCircle className="size-4 shrink-0 text-red-700 dark:text-rose-300" />
      <span>{serverError}</span>
    </p>
  );

  if (step === 'email') {
    const { register, handleSubmit, formState: { errors } } = emailForm;
    return (
      <div>
        <h1 className="m-0 text-[26px] font-bold tracking-tight text-[#2A0E7A] lg:text-[30px]">
          Recuperar contraseña
        </h1>
        <p className="mt-1 mb-5 text-sm text-[#8C87A3] lg:mb-6">
          Ingresá el correo de tu cuenta y te enviaremos un código para elegir una contraseña nueva.
        </p>

        <form
          onSubmit={handleSubmit(values => requestCode(values.email.trim()))}
          noValidate
          className="m-0 grid max-w-none gap-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="forgot-email" className={labelClass}>
              Correo electrónico
            </Label>
            <IconInput
              icon={Mail}
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              disabled={isSending}
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

          {errorBox}

          <Button type="submit" disabled={isSending} className={`${primaryButtonClass} mt-2`}>
            {isSending && <Loader2 className="animate-spin" />}
            {isSending ? 'Enviando código…' : 'Enviar código'}
          </Button>

          <Button type="button" onClick={onBack} disabled={isSending} className={secondaryButtonClass}>
            Volver a iniciar sesión
          </Button>
        </form>
      </div>
    );
  }

  const { register, handleSubmit, formState: { errors } } = passwordForm;
  return (
    <div>
      <button type="button" onClick={changeEmail} disabled={isResetting} className={backLinkClass}>
        <ArrowLeft className="size-3.5" />
        Modificar correo
      </button>

      <h1 className="m-0 text-[24px] font-bold tracking-tight text-[#2A0E7A] lg:text-[26px]">
        Elegí una contraseña nueva
      </h1>
      <p className="mt-1 mb-3 text-xs text-[#8C87A3]">
        Ingresá el código de 6 dígitos que enviamos a{' '}
        <strong className="break-words text-[#1C1633]">{email}</strong>
      </p>

      {notice && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[#2A0E7A] px-3.5 py-2 text-xs font-medium text-white shadow-[0_8px_20px_rgba(42,14,122,0.3)]">
          <CheckCircle2 className="size-4 shrink-0 text-[#FFD54A]" />
          <span className="flex-1">{notice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(resetPassword)} noValidate className="m-0 grid max-w-none gap-3">
        <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
          <legend className={cn(labelClass, 'mb-1.5 p-0')}>Código de verificación</legend>
          <div className="flex items-center justify-between gap-1.5">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={element => (codeRefs.current[index] = element)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                value={digit}
                disabled={isResetting}
                onChange={event => handleCodeChange(index, event.target.value)}
                onKeyDown={event => handleCodeKeyDown(index, event)}
                onPaste={handleCodePaste}
                className={cn(
                  'h-12 w-full min-w-0 max-w-11 rounded-xl border-2 text-center font-mono text-xl font-bold outline-none transition-all duration-150',
                  digit
                    ? 'border-[#5B2EE0] bg-[#FAF8FE] text-[#1C1633]'
                    : 'border-transparent bg-[#F3F1F9] text-[#1C1633] focus:border-[#5B2EE0] focus:bg-white focus:ring-2 focus:ring-[#5B2EE0]/30',
                )}
                aria-label={`Dígito ${index + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-[#8C87A3]">
            {countdown > 0 ? (
              <span>
                Reenviar código en <strong className="font-mono text-[#5B2EE0]">{countdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => requestCode(email)}
                disabled={isSending || isResetting}
                className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
              >
                {isSending ? 'Enviando…' : 'Reenviar código'}
              </button>
            )}
            <span className="text-[11px] text-[#ABA6C2]">Vence en 10 minutos</span>
          </div>
        </fieldset>

        <div className="grid gap-1">
          <Label htmlFor="reset-password" className={labelClass}>
            Contraseña nueva
          </Label>
          <PasswordInput
            icon={Lock}
            id="reset-password"
            autoComplete="new-password"
            placeholder="Ingresá tu contraseña nueva"
            valid={hasMinLength && hasUppercase && hasLowercase && hasNumber}
            disabled={isResetting}
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

        <div className="grid gap-1">
          <Label htmlFor="reset-confirm-password" className={labelClass}>
            Repetir contraseña
          </Label>
          <PasswordInput
            icon={Lock}
            id="reset-confirm-password"
            autoComplete="new-password"
            placeholder="Repetí tu contraseña nueva"
            valid={passwordsMatch}
            disabled={isResetting}
            className={inputClass}
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p role="alert" className="m-0 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-[#F8F6FD] p-2 text-xs">
          <p className="m-0 mb-1 text-[11px] font-medium text-[#4A4560]">Requisitos de la contraseña:</p>
          <div className="grid grid-cols-2 gap-1">
            <RequirementItem met={hasMinLength} text="Mínimo 8 caracteres" />
            <RequirementItem met={hasUppercase} text="Una mayúscula" />
            <RequirementItem met={hasLowercase} text="Una minúscula" />
            <RequirementItem met={hasNumber} text="Un número" />
          </div>
        </div>

        {errorBox}

        <Button type="submit" disabled={isResetting || !codeComplete} className={`${primaryButtonClass} mt-1`}>
          {isResetting && <Loader2 className="animate-spin" />}
          {isResetting ? 'Guardando…' : 'Cambiar contraseña'}
        </Button>
      </form>

      <Dialog open={done} onOpenChange={open => !open && onBack?.()}>
        <DialogContent showClose={false} className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="size-7" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">Contraseña actualizada</DialogTitle>
            <DialogDescription className="pt-1 text-center text-[14px] leading-relaxed">
              Ya podés iniciar sesión con tu contraseña nueva. Por seguridad, cerramos las sesiones abiertas en otros dispositivos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button type="button" onClick={() => onBack?.()} className={primaryButtonClass}>
              Iniciar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
