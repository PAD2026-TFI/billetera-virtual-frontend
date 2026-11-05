import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
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
import { IconInput } from './IconInput.jsx';
import { alertClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './styles.js';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresá tu correo electrónico.')
    .email('El formato del correo no es válido.')
    .max(254, 'Máximo 254 caracteres.'),
});

export default function ForgotPasswordForm({ onBack }) {
  const [modalEmail, setModalEmail] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
  });

  async function onSubmit(values) {
    await new Promise(resolve => setTimeout(resolve, 600));
    setModalEmail(values.email);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    if (onBack) {
      onBack();
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] shadow-none transition-colors hover:bg-transparent hover:text-[#3D1499] focus:outline-none"
      >
        <ArrowLeft className="size-3.5" />
        Volver
      </button>

      <h1 className="m-0 text-[26px] font-bold tracking-tight text-[#2A0E7A] lg:text-[30px]">
        Recuperar contraseña
      </h1>
      <p className="mt-1 mb-5 text-sm text-[#8C87A3] lg:mb-6">
        Ingresá tu correo electrónico y te enviaremos un enlace para restablecerla.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="m-0 grid max-w-none gap-4">
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

        <Button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} mt-2`}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
        </Button>

        <Button type="button" onClick={onBack} disabled={isSubmitting} className={secondaryButtonClass}>
          Volver a iniciar sesión
        </Button>
      </form>

      <Dialog open={modalOpen} onOpenChange={open => !open && handleModalClose()}>
        <DialogContent showClose={false} className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="size-7" />
          </div>

          <DialogHeader>
            <DialogTitle className="text-center">Enlace enviado</DialogTitle>
            <DialogDescription className="text-center pt-1 text-[14px] leading-relaxed">
              Te enviamos las instrucciones y el enlace de recuperación a{' '}
              <strong className="text-[#1C1633] dark:text-[#F4F2FA] font-medium">{modalEmail}</strong> para que puedas crear una nueva contraseña.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={handleModalClose}
              className={primaryButtonClass}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
