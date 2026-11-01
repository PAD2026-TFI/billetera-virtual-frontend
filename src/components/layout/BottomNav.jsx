import { ArrowLeftRight, CreditCard, Home, ListOrdered, QrCode } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes, sectionFromPath } from '@/lib/routes';

const left = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'movements', label: 'Movimientos', icon: ListOrdered },
];
const right = [
  { id: 'transfer', label: 'Transferir', icon: ArrowLeftRight },
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const active = sectionFromPath(useLocation().pathname);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-[#ECE9F5] bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden dark:border-[#261E3D] dark:bg-[#0E0A1A]/85"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
        {left.map(item => <NavItem key={item.id} item={item} active={active === item.id} onSelect={() => navigate(routes[item.id])} />)}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate(routes.pay)}
            aria-label="Pagar con QR"
            aria-current={active === 'pay' ? 'page' : undefined}
            className="m-0 -mt-6 mb-2 grid size-14 place-items-center rounded-full border-4 border-white bg-[#4C1DB8] p-0 text-white shadow-[0_10px_24px_-8px_rgba(76,29,184,0.8)] dark:border-[#090613] dark:bg-[#5B2EE0]"
          >
            <QrCode className="size-6" />
          </button>
        </div>
        {right.map(item => <NavItem key={item.id} item={item} active={active === item.id} onSelect={() => navigate(routes[item.id])} />)}
      </div>
    </nav>
  );
}

function NavItem({ item: { label, icon: Icon }, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      className={`m-0 flex h-16 flex-col items-center justify-center gap-1 rounded-none border-0 bg-transparent p-0 text-[11px] font-medium ${active ? 'text-[#4C1DB8] dark:text-[#B9A6FF]' : 'text-[#8C87A3] dark:text-[#6B6485]'}`}
    >
      <Icon className="size-[22px]" aria-hidden="true" />
      {label}
    </button>
  );
}
