import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import QRCode from 'qrcode';
import { Check, Copy, Loader2, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { alertClass, fieldInputClass, primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

const codeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Ingresá los 6 números que muestra tu app.'),
});

const groupSecret = secret => secret.replace(/(.{4})/g, '$1 ').trim();

function CodeForm({ submitLabel, onSubmit, onCancel }) {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(codeSchema),
    mode: 'onTouched',
  });

  async function submit(values) {
    setError('');
    try {
      await onSubmit(values.code);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="m-0 grid max-w-none gap-3">
      <label htmlFor="two-factor-setting-code" className="grid gap-1.5 text-sm font-medium text-[#4A4560] dark:text-[#9D97B5]">
        Código de 6 números
        <input
          id="two-factor-setting-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className={`${fieldInputClass} font-mono tracking-[0.3em]`}
          aria-invalid={!!errors.code}
          {...register('code')}
        />
      </label>
      {errors.code && <p role="alert" className="m-0 text-xs text-red-600 dark:text-rose-300">{errors.code.message}</p>}
      {error && <p role="alert" className={alertClass}>{error}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onCancel} className={secondaryActionClass}>Cancelar</button>
        <button type="submit" disabled={isSubmitting} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function SetupStep({ setup, onConfirm, onCancel }) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(setup.otpAuthUri, { margin: 1, width: 192 }).then(url => active && setQr(url)).catch(() => {});
    return () => {
      active = false;
    };
  }, [setup.otpAuthUri]);

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-4">
      <ol className="m-0 grid gap-1 pl-5 text-sm text-[#4A4560] dark:text-[#9D97B5]">
        <li>Abrí tu app de autenticación (Google Authenticator, Microsoft Authenticator u otra).</li>
        <li>Escaneá el código QR o cargá la clave a mano.</li>
        <li>Ingresá el código de 6 números que te muestra la app.</li>
      </ol>
      <div className="grid justify-items-center gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
        {qr ? (
          <img src={qr} alt="Código QR para configurar tu app de autenticación" className="size-48 rounded-xl bg-white p-2" />
        ) : (
          <span aria-busy="true" className="grid size-48 place-items-center"><Loader2 className="size-6 animate-spin text-[#4C1DB8]" aria-hidden="true" /></span>
        )}
        <div className="flex w-full items-center justify-between gap-2">
          <span className="min-w-0 font-mono text-xs break-all text-[#1C1633] dark:text-[#F4F2FA]">{groupSecret(setup.secret)}</span>
          <button
            type="button"
            onClick={copySecret}
            aria-label={copied ? 'Clave copiada' : 'Copiar clave'}
            className="m-0 grid size-11 shrink-0 place-items-center rounded-full border-0 bg-white p-0 text-[#4C1DB8] hover:bg-[#E9E5F6] dark:bg-[#140F24] dark:text-[#B9A6FF]"
          >
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <CodeForm submitLabel="Activar" onSubmit={onConfirm} onCancel={onCancel} />
    </div>
  );
}

export default function TwoFactorSettings() {
  const isDemoSession = useAuthStore(state => state.session?.token === 'mock-jwt-token');
  const [status, setStatus] = useState(null);
  const [unavailable, setUnavailable] = useState(isDemoSession);
  const [dialog, setDialog] = useState(null);
  const [setup, setSetup] = useState(null);
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    if (isDemoSession) return undefined;
    let active = true;
    api('/api/v1/me/two-factor')
      .then(result => active && setStatus(result))
      .catch(() => active && setUnavailable(true));
    return () => {
      active = false;
    };
  }, [isDemoSession]);

  if (unavailable || !status) return null;

  async function openSetup() {
    setDialog('enable');
    setSetup(null);
    setSetupError('');
    try {
      setSetup(await api('/api/v1/me/two-factor/setup', { method: 'POST' }));
    } catch (e) {
      setSetupError(e.message);
    }
  }

  async function confirm(code) {
    setStatus(await api('/api/v1/me/two-factor/confirm', { method: 'POST', body: { code } }));
    setDialog(null);
    useNotificationStore.getState().notify('Activaste la verificación en dos pasos.');
  }

  async function disable(code) {
    setStatus(await api('/api/v1/me/two-factor/disable', { method: 'POST', body: { code } }));
    setDialog(null);
    useNotificationStore.getState().notify('Desactivaste la verificación en dos pasos.');
  }

  return (
    <div className="rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[12rem] flex-1">
          <span className="flex items-center gap-2 text-sm font-bold text-[#1C1633] dark:text-[#F4F2FA]">
            Verificación en dos pasos
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.enabled ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#C4B2FF]'}`}>
              {status.enabled ? 'Activa' : 'Inactiva'}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-[#6E6888] dark:text-[#9D97B5]">
            Al iniciar sesión te pedimos un código de tu app de autenticación.
          </span>
        </div>
        <button
          type="button"
          onClick={status.enabled ? () => setDialog('disable') : openSetup}
          className={`${status.enabled ? secondaryActionClass : primaryActionClass} h-10 w-auto shrink-0 px-4 text-sm`}
        >
          {status.enabled ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      <Dialog open={dialog !== null} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="grid max-w-[420px] gap-4 rounded-[28px] p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#FFD54A]">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <DialogTitle className="text-lg">
              {dialog === 'disable' ? 'Desactivar la verificación' : 'Activar la verificación en dos pasos'}
            </DialogTitle>
          </div>
          <DialogDescription className="m-0">
            {dialog === 'disable'
              ? 'Para confirmar que sos vos, ingresá el código actual de tu app de autenticación.'
              : 'Vas a necesitar el código de tu app cada vez que inicies sesión.'}
          </DialogDescription>
          {dialog === 'disable' && <CodeForm submitLabel="Desactivar" onSubmit={disable} onCancel={() => setDialog(null)} />}
          {dialog === 'enable' && setupError && <p role="alert" className={alertClass}>{setupError}</p>}
          {dialog === 'enable' && !setupError && !setup && (
            <span aria-busy="true" className="grid h-48 place-items-center"><Loader2 className="size-6 animate-spin text-[#4C1DB8]" aria-hidden="true" /></span>
          )}
          {dialog === 'enable' && setup && <SetupStep setup={setup} onConfirm={confirm} onCancel={() => setDialog(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
