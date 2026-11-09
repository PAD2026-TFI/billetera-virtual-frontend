import { useState } from 'react';
import { CheckCircle2, CreditCard, Eye, EyeOff, LogOut, Mail, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import AccountDetails from '@/components/dashboard/AccountDetails';
import { sectionTitleClass } from '@/components/forms/formStyles';
import { useAuthStore, useSignOut } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';

const rowClass = 'flex min-h-11 items-center justify-between gap-4 py-3';
const labelClass = 'text-sm text-[#8C87A3] dark:text-[#9D97B5]';

function ProfileContent({ summary }) {
  const [showAccountDetails, setShowAccountDetails] = useState(false);
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
    { label: 'Tipo de cuenta', value: 'Cuenta personal' },
  ].filter(row => row.value);

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Tu cuenta"
        className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${panelClass}`}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <span
              aria-hidden="true"
              className="grid size-16 place-items-center rounded-full bg-gradient-to-tr from-[#3A1299] via-[#4C1DB8] to-[#7A4DFF] text-2xl font-bold text-white shadow-[0_8px_20px_-6px_rgba(76,29,184,0.6)] sm:size-20 dark:from-[#2A0E7A] dark:to-[#5B2EE0]"
            >
              {firstName[0]}{lastName[0]}
            </span>
            <span
              className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white dark:border-[#140F24]"
              aria-hidden="true"
            >
              <CheckCircle2 className="size-3.5" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-xl font-bold tracking-tight text-[#1C1633] sm:text-2xl dark:text-[#F4F2FA]">
                {firstName} {lastName}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Cuenta activa
              </span>
            </div>
            {user?.email && (
              <p className="mt-1 mb-0 flex items-center gap-1.5 text-sm text-[#8C87A3] dark:text-[#9D97B5]">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </p>
            )}
            <p className="m-0 mt-0.5 text-xs text-[#8C87A3] dark:text-[#6B6485]">
              Titular verificado · padi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[#ECE9F5] bg-[#F8F7FD] px-4 py-2.5 text-xs text-[#4A4560] sm:self-center dark:border-[#261E3D] dark:bg-[#1E1735] dark:text-[#9D97B5]">
          <ShieldCheck className="size-4 shrink-0 text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
          <span>Nivel de seguridad alto</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="personal-title" className={panelClass}>
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
              <h2 id="personal-title" className={sectionTitleClass}>
                Datos personales
              </h2>
            </div>
            <dl className="m-0 mt-3 divide-y divide-[#ECE9F5] dark:divide-[#261E3D]">
              {personalData.map(row => (
                <div key={row.label} className={rowClass}>
                  <dt className={labelClass}>{row.label}</dt>
                  <dd className="m-0 min-w-0 text-right text-sm font-medium break-all text-[#1C1633] dark:text-[#F4F2FA]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              aria-expanded={showAccountDetails}
              onClick={() => setShowAccountDetails(prev => !prev)}
              className="m-0 flex w-full items-center justify-between rounded-2xl border border-[#ECE9F5] bg-white p-4 shadow-sm transition-all hover:border-[#D8CFFA] hover:shadow-md dark:border-[#261E3D] dark:bg-[#140F24] dark:hover:border-[#3D335A]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-[#E6DFFB] text-[#4C1DB8] dark:bg-[#281F45] dark:text-[#B9A6FF]">
                  <CreditCard className="size-5" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-semibold text-[#1C1633] dark:text-[#F4F2FA]">
                    Datos para recibir dinero
                  </span>
                  <span className="block text-xs text-[#8C87A3] dark:text-[#9D97B5]">
                    CVU y Alias de tu cuenta
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ECE9F5] bg-[#F8F7FD] px-3.5 py-1.5 text-xs font-semibold text-[#4C1DB8] dark:border-[#261E3D] dark:bg-[#1E1735] dark:text-[#B9A6FF]">
                {showAccountDetails ? (
                  <>
                    <EyeOff className="size-3.5" />
                    <span>Ocultar datos</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5" />
                    <span>Ver datos</span>
                  </>
                )}
              </span>
            </button>

            {showAccountDetails && (
              <div className={`animate-page-enter ${panelClass}`}>
                <AccountDetails cvu={summary.account.cvu} alias={summary.account.alias} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="preferences-title" className={panelClass}>
            <h2 id="preferences-title" className={sectionTitleClass}>
              Preferencias
            </h2>
            <div className="mt-3 divide-y divide-[#ECE9F5] dark:divide-[#261E3D]">
              <div className={rowClass}>
                <div>
                  <span className="block text-sm font-medium text-[#1C1633] dark:text-[#F4F2FA]">
                    Modo oscuro
                  </span>
                  <span className="block text-xs text-[#8C87A3] dark:text-[#9D97B5]">
                    Alterná entre la vista clara y oscura
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  aria-label="Modo oscuro"
                  onClick={toggleTheme}
                  className={`m-0 inline-flex h-8 w-14 shrink-0 items-center rounded-full border-0 p-1 transition-colors ${
                    isDark ? 'bg-[#5B2EE0]' : 'bg-[#E2DCF5]'
                  }`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full bg-white text-[#4C1DB8] shadow transition-transform ${
                      isDark ? 'translate-x-6' : ''
                    }`}
                  >
                    <ThemeIcon className="size-3.5" aria-hidden="true" />
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-[#ECE9F5] pt-5 dark:border-[#261E3D]">
              <p className="m-0 mb-3 text-xs text-[#8C87A3] dark:text-[#9D97B5]">
                Finalizá la sesión activa en este dispositivo.
              </p>
              <button
                type="button"
                onClick={signOut}
                className="m-0 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-0 bg-red-50 text-[15px] font-semibold text-red-700 transition-colors hover:bg-red-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
              >
                <LogOut className="size-[18px]" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </section>
        </div>
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
