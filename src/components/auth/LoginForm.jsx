import { Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconInput, PasswordInput } from './IconInput.jsx';
import { alertClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './styles.js';

// Solo la parte visual del inicio de sesión.
// La lógica (llamar al backend, guardar la sesión) sigue en App.jsx.
export default function LoginForm({ onSubmit, busy, error, onCreateAccount }) {
  return (
    <div>
      <h1 className="m-0 text-[30px] font-bold tracking-tight text-[#2A0E7A]">Iniciar sesión</h1>
      <p className="mt-1.5 mb-7 text-sm text-[#8C87A3]">Qué bueno verte de nuevo.</p>

      <form onSubmit={onSubmit} className="m-0 grid max-w-none gap-4">
        <div className="grid gap-2">
          <Label htmlFor="login-email" className={labelClass}>Correo electrónico</Label>
          <IconInput icon={Mail} id="login-email" name="email" type="email" required maxLength={254}
            autoComplete="username" placeholder="nombre@correo.com" className={inputClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="login-password" className={labelClass}>Contraseña</Label>
          <PasswordInput icon={Lock} id="login-password" name="password" required minLength={12} maxLength={128}
            autoComplete="current-password" className={inputClass} />
        </div>

        {error && <p role="alert" className={alertClass}>{error}</p>}

        <Button type="submit" disabled={busy} className={`${primaryButtonClass} mt-3`}>
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
    <div className="my-3 flex items-center gap-3 text-xs text-[#ABA6C2]">
      <span className="h-px flex-1 bg-[#ECE9F5]" />o<span className="h-px flex-1 bg-[#ECE9F5]" />
    </div>
  );
}
