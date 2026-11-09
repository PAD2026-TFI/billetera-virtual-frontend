import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from 'cn';
import { Input } from '@/components/ui/input';

export function IconInput({ icon: Icon, valid = false, className = '', ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className={cn(
            'pointer-events-none absolute top-1/2 left-4 z-10 size-[18px] -translate-y-1/2 transition-colors',
            valid ? 'text-emerald-600' : 'text-[#9C96B5]'
          )}
        />
      )}
      <Input
        className={cn(
          className,
          valid && '!border-2 !border-emerald-500 !ring-2 !ring-emerald-500/25 !bg-emerald-50/20'
        )}
        {...props}
      />
    </div>
  );
}

export function PasswordInput({ icon: Icon, valid = false, className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className={cn(
            'pointer-events-none absolute top-1/2 left-4 z-10 size-[18px] -translate-y-1/2 transition-colors',
            valid ? 'text-emerald-600' : 'text-[#9C96B5]'
          )}
        />
      )}
      <Input
        type={visible ? 'text' : 'password'}
        className={cn(
          className,
          'pr-12',
          valid && '!border-2 !border-emerald-500 !ring-2 !ring-emerald-500/25 !bg-emerald-50/20'
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 z-10 m-0 grid w-12 place-items-center rounded-r-xl border-0 bg-transparent p-0 text-[#9C96B5] hover:text-[#4C1DB8]"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}
