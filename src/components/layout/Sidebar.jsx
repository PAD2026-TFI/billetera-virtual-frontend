import { ArrowLeftRight, CreditCard, Home, ListOrdered, LogOut, Moon, QrCode, Store, Sun, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wordmark } from '@/components/auth/AuthLayout';
import { routes, sectionFromPath } from '@/lib/routes';
import { isMerchantUser, useAuthStore, useSignOut } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const active = sectionFromPath(useLocation().pathname);
  const signOut = useSignOut();
  const isMerchant = useAuthStore(state => isMerchantUser(state.session?.user));
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const ThemeIcon = isDark ? Sun : Moon;

  const sections = [
    [
      { id: 'home', label: 'Inicio', icon: Home },
      { id: 'movements', label: 'Movimientos', icon: ListOrdered },
      { id: 'transfer', label: 'Transferir', icon: ArrowLeftRight },
      { id: 'pay', label: 'Pagar con QR', icon: QrCode },
      ...(isMerchant ? [{ id: 'collections', label: 'Cobros', icon: Store }] : []),
    ],
    [
      { id: 'card', label: 'Mi tarjeta', icon: CreditCard },
      { id: 'profile', label: 'Mi perfil', icon: UserRound },
    ],
  ];

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col bg-[#1C1633] px-4 py-7 text-white lg:flex dark:border-r dark:border-[#261E3D] dark:bg-[#0E0A1A]">
      <div className="px-3">
        <Wordmark light />
      </div>

      <nav aria-label="Menú lateral" className="mt-10 flex flex-1 flex-col gap-6">
        {sections.map((items, index) => (
          <ul key={index} className="m-0 grid list-none gap-1 p-0">
            {items.map(({ id, label, icon: Icon }) => {
              const isActive = id === active;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => navigate(routes[id])}
                    aria-current={isActive ? 'page' : undefined}
                    className={`m-0 flex h-11 w-full items-center gap-3 rounded-xl border-0 px-3 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#4C1DB8] text-white dark:bg-[#5B2EE0]'
                        : 'bg-transparent text-white/65 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>

      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        className="m-0 flex h-11 items-center gap-3 rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white"
      >
        <ThemeIcon className="size-[18px]" aria-hidden="true" />
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </button>
      <button
        type="button"
        onClick={signOut}
        className="m-0 flex h-11 items-center gap-3 rounded-xl border-0 bg-transparent px-3 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-[18px]" aria-hidden="true" />
        Cerrar sesión
      </button>
    </aside>
  );
}
