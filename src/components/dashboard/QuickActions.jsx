import { ArrowLeftRight, CreditCard, Plus, QrCode } from 'lucide-react';

const actions = [
  { id: 'topUp', label: 'Cargar', icon: Plus },
  { id: 'transfer', label: 'Transferir', icon: ArrowLeftRight },
  { id: 'pay', label: 'Pagar', icon: QrCode },
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
];

export default function QuickActions({ onAction }) {
  return (
    <nav aria-label="Acciones rápidas" className="grid grid-cols-4 gap-2">
      {actions.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onAction?.(id)}
          className="group m-0 flex flex-col items-center gap-2 rounded-2xl border-0 bg-transparent p-1 text-[13px] font-medium text-[#1C1633] dark:text-[#F4F2FA]"
        >
          <span className="grid size-14 place-items-center rounded-full bg-[#4C1DB8] text-white shadow-[0_10px_20px_-10px_rgba(76,29,184,0.8)] transition-colors group-hover:bg-[#3D1499] dark:bg-[#5B2EE0] dark:group-hover:bg-[#6C3BF4]">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
