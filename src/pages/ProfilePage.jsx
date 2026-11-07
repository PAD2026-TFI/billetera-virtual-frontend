import { LogOut, Moon, Sun } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import AccountDetails from '@/components/dashboard/AccountDetails';
import { sectionTitleClass } from '@/components/forms/formStyles';
import { useAuthStore, useSignOut } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';

const rowClass = 'flex min-h-11 items-center justify-between gap-4 py-3';
const labelClass = 'text-sm text-[#8C87A3] dark:text-[#9D97B5]';

function ProfileContent({ summary }) {
  const user = useAuthStore(state => state.session?.user);
  const signOut = useSignOut();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const ThemeIcon = isDark ? Sun : Moon;
  const { firstName, lastName } = summary.holder;

  const personalData = [
    { label: 'Nombre', value: firstName },
    { label: 'Apellido', value: lastName },
    { label: 'Correo electrónico', value: user?.email },
  ].filter(row => row.value);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
      <section aria-label="Tu cuenta" className={`grid justify-items-center gap-3 text-center ${panelClass}`}>
        <span aria-hidden="true" className="grid size-20 place-items-center rounded-full bg-[#4C1DB8] text-2xl font-semibold text-white shadow-[0_12px_24px_-12px_rgba(76,29,184,0.8)] dark:bg-[#5B2EE0]">
          {firstName[0]}{lastName[0]}
        </span>
        <div>
          <p className="m-0 text-xl font-semibold">{firstName} {lastName}</p>
          {user?.email && <p className="m-0 mt-0.5 text-sm break-all text-[#8C87A3] dark:text-[#9D97B5]">{user.email}</p>}
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Cuenta activa</span>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-7">
        <section aria-labelledby="personal-title" className={panelClass}>
          <h2 id="personal-title" className={sectionTitleClass}>Datos personales</h2>
          <dl className="m-0 mt-2 divide-y divide-[#ECE9F5] dark:divide-[#261E3D]">
            {personalData.map(row => (
              <div key={row.label} className={rowClass}>
                <dt className={labelClass}>{row.label}</dt>
                <dd className="m-0 min-w-0 text-right text-sm font-medium break-all">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className={panelClass}>
          <AccountDetails cvu={summary.account.cvu} alias={summary.account.alias} />
        </div>

        <section aria-labelledby="preferences-title" className={panelClass}>
          <h2 id="preferences-title" className={sectionTitleClass}>Preferencias</h2>
          <div className={`${rowClass} mt-2`}>
            <span className={labelClass}>Modo oscuro</span>
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label="Modo oscuro"
              onClick={toggleTheme}
              className={`m-0 inline-flex h-8 w-14 shrink-0 items-center rounded-full border-0 p-1 transition-colors ${isDark ? 'bg-[#5B2EE0]' : 'bg-[#E2DCF5]'}`}
            >
              <span className={`grid size-6 place-items-center rounded-full bg-white text-[#4C1DB8] shadow transition-transform ${isDark ? 'translate-x-6' : ''}`}>
                <ThemeIcon className="size-3.5" aria-hidden="true" />
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="m-0 mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-0 bg-red-50 text-[15px] font-semibold text-red-700 hover:bg-red-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
            Cerrar sesión
          </button>
        </section>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AppLayout header={() => <PageHeader title="Mi perfil" subtitle="Tus datos y la configuración de tu cuenta." showProfile={false} />}>
      {summary => <ProfileContent summary={summary} />}
    </AppLayout>
  );
}
