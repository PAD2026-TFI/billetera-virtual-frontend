import { ArrowLeftRight, CreditCard, Plus, QrCode } from 'lucide-react';

const actions = [
  {
    id: 'topUp',
    label: 'Cargar',
    icon: Plus,
    tileClass:
      'border-[#E8DFB5] bg-gradient-to-b from-[#FFFDF5] to-[#FFF6D6] hover:border-[#FFD54A] dark:border-[#FFD54A]/25 dark:from-[#211A29] dark:to-[#1B1426] dark:hover:border-[#FFD54A]/50',
    iconClass:
      'bg-[#FFD54A] text-[#1C1633] shadow-[0_10px_20px_-8px_rgba(245,184,46,0.75)] ring-1 ring-inset ring-white/40 group-hover:bg-[#FFDE6A]',
  },
  {
    id: 'transfer',
    label: 'Transferir',
    icon: ArrowLeftRight,
    tileClass:
      'border-[#ECE9F5] bg-[#FAF9FE] hover:border-[#4C1DB8]/35 dark:border-[#261E3D] dark:bg-[#19122C] dark:hover:border-[#5B2EE0]/60',
    iconClass:
      'bg-[#4C1DB8] text-white shadow-[0_10px_20px_-8px_rgba(76,29,184,0.75)] ring-1 ring-inset ring-white/20 group-hover:bg-[#3D1499] dark:bg-[#5B2EE0] dark:group-hover:bg-[#6C3BF4]',
  },
  {
    id: 'pay',
    label: 'Pagar',
    icon: QrCode,
    tileClass:
      'border-[#ECE9F5] bg-[#FAF9FE] hover:border-[#4C1DB8]/35 dark:border-[#261E3D] dark:bg-[#19122C] dark:hover:border-[#5B2EE0]/60',
    iconClass:
      'bg-[#EDE7FC] text-[#4C1DB8] ring-1 ring-inset ring-[#4C1DB8]/15 group-hover:bg-[#E2D8FA] dark:bg-[#261D42] dark:text-[#C4B2FF] dark:ring-[#5B2EE0]/35 dark:group-hover:bg-[#312554]',
  },
  {
    id: 'card',
    label: 'Tarjeta',
    icon: CreditCard,
    tileClass:
      'border-[#ECE9F5] bg-[#FAF9FE] hover:border-[#4C1DB8]/35 dark:border-[#261E3D] dark:bg-[#19122C] dark:hover:border-[#5B2EE0]/60',
    iconClass:
      'bg-[#EDE7FC] text-[#4C1DB8] ring-1 ring-inset ring-[#4C1DB8]/15 group-hover:bg-[#E2D8FA] dark:bg-[#261D42] dark:text-[#FFD54A] dark:ring-[#FFD54A]/25 dark:group-hover:bg-[#312554]',
  },
];

export default function QuickActions({ onAction }) {
  return (
    <nav aria-label="Acciones rápidas" className="grid grid-cols-4 gap-2.5">
      {actions.map(({ id, label, icon: Icon, tileClass, iconClass }) => (
        <button
          key={id}
          type="button"
          onClick={() => onAction?.(id)}
          className={`group m-0 flex flex-col items-center gap-2 rounded-[20px] border p-2.5 text-xs font-semibold tracking-[-0.01em] text-[#1C1633] transition-all duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/40 focus-visible:outline-none sm:text-[13px] dark:text-[#F4F2FA] ${tileClass}`}
        >
          <span
            className={`grid size-12 place-items-center rounded-2xl transition-transform duration-150 group-hover:scale-105 ${iconClass}`}
          >
            <Icon className="size-5 stroke-[2.2]" aria-hidden="true" />
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
