import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Campo de texto con un ícono a la izquierda.
export function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#9C96B5]" />
      <Input {...props} />
    </div>
  );
}

// Igual que IconInput, pero con un botón para mostrar u ocultar la contraseña.
export function PasswordInput({ icon: Icon, className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#9C96B5]" />
      <Input type={visible ? 'text' : 'password'} className={`${className} pr-12`} {...props} />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 m-0 grid w-12 place-items-center rounded-r-xl border-0 bg-transparent p-0 text-[#9C96B5] hover:text-[#4C1DB8]"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}
