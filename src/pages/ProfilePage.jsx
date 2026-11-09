import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Store,
  Sun,
  UserRound,
} from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import AccountDetails from '@/components/dashboard/AccountDetails';
import { sectionTitleClass } from '@/components/forms/formStyles';
import { routes } from '@/lib/routes';
import { isMerchantUser, useAuthStore, useSignOut } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useThemeStore } from '@/store/useThemeStore';

const profilePanelClass = `${panelClass} m-0 border-0 lg:dark:border-0`;

function ProfileContent({ summary }) {
  const navigate = useNavigate();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [changingType, setChangingType] = useState(false);
  const user = useAuthStore(state => state.session?.user);
  const setAccountType = useAuthStore(state => state.setAccountType);
  const isMerchant = isMerchantUser(user);
  const signOut = useSignOut();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const ThemeIcon = isDark ? Sun : Moon;
  const { firstName, lastName } = summary.holder;

  const personalData = [
    { label: 'Nombre', value: firstName },
    { label: 'Apellido', value: lastName },
    { label: 'Correo electrónico', value: user?.email, mono: true },
    { label: 'Tipo de cuenta', value: isMerchant ? 'Cuenta Vendedor / Comercio' : 'Cuenta personal' },
  ].filter(row => row.value);

  return (
    <div className="grid grid-cols-1 gap-6">
      <section
        aria-label="Tu cuenta"
        className="relative m-0 flex flex-col justify-between gap-5 overflow-hidden rounded-[28px] border-0 bg-gradient-to-br from-[#231052] via-[#170A38] to-[#0D0620] p-6 text-white shadow-[0_24px_50px_-22px_rgba(37,16,87,0.85)] sm:flex-row sm:items-center lg:p-7 dark:shadow-none"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(255,213,74,0.2)_0%,transparent_70%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(122,77,255,0.35)_0%,transparent_70%)]"
        />

        <div className="relative flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <span
              aria-hidden="true"
              className="grid size-16 place-items-center rounded-2xl bg-[#FFD54A] font-mono text-xl font-bold text-[#1C1633] shadow-[0_12px_24px_-8px_rgba(255,213,74,0.6)] sm:size-20 sm:text-2xl"
            >
              {firstName[0]}
              {lastName[0]}
            </span>
            <span
              className="absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full border-2 border-[#170A38] bg-emerald-400 text-[#090613]"
              aria-hidden="true"
            >
              <CheckCircle2 className="size-3.5 stroke-[2.5]" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="m-0 text-xl font-bold tracking-tight text-white sm:text-2xl">
                {firstName} {lastName}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                Cuenta activa
              </span>
            </div>

            {user?.email && (
              <p className="mt-1.5 mb-0 flex items-center gap-1.5 font-mono text-xs text-white/75 sm:text-sm">
                <Mail className="size-3.5 shrink-0 text-[#FFD54A]" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </p>
            )}

            <p className="m-0 mt-1 flex items-center gap-1.5 text-xs text-white/60">
              <Sparkles className="size-3 text-[#FFD54A]" aria-hidden="true" />
              <span>Titular verificado · Alias {summary.account.alias}</span>
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-xs text-white sm:self-center">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FFD54A]/20 text-[#FFD54A]">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <span className="block font-bold text-white">Nivel de seguridad alto</span>
            <span className="block text-[11px] text-white/65">Biometría y token activos</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="flex h-full flex-col justify-between gap-6">
          <section
            aria-labelledby="personal-title"
            className={`flex flex-1 flex-col justify-between ${profilePanelClass}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#FFD54A]">
                  <UserRound className="size-4 stroke-[2.2]" aria-hidden="true" />
                </span>
                <h2 id="personal-title" className={`${sectionTitleClass} m-0 tracking-tight`}>
                  Datos personales
                </h2>
              </div>
              <span className="rounded-full bg-[#F3F1F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#C4B2FF]">
                KYC Validado
              </span>
            </div>

            <dl className="m-0 mt-4 divide-y divide-[#ECE9F5] dark:divide-[#261E3D]">
              {personalData.map(row => (
                <div
                  key={row.label}
                  className="flex min-h-11 items-center justify-between gap-4 py-3 first:pt-1 last:pb-0"
                >
                  <dt className="text-sm text-[#6E6888] dark:text-[#9D97B5]">{row.label}</dt>
                  <dd
                    className={`m-0 min-w-0 text-right text-sm font-semibold break-all text-[#1C1633] dark:text-[#F4F2FA] ${
                      row.mono ? 'font-mono text-xs sm:text-sm' : ''
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE9F5] pt-3 dark:border-[#261E3D]">
              <div>
                <p className="m-0 text-xs font-semibold text-[#1C1633] dark:text-white">
                  Modalidad Vendedor
                </p>
                <p className="m-0 text-[11px] text-[#8C87A3] dark:text-[#6E6888]">
                  {isMerchant
                    ? 'Tenés habilitados Cobros e Integraciones. Pasar a Personal revoca tu API Key activa.'
                    : 'Activá la sección de Cobros para generar links y QR.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isMerchant && (
                  <button type="button" onClick={() => navigate(routes.integrations)} className="rounded-full border border-violet-400 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-200">Integraciones</button>
                )}
                {isMerchant && (
                  <button
                    type="button"
                    onClick={() => navigate(routes.collections)}
                    className="m-0 inline-flex items-center gap-1.5 rounded-full bg-[#5B2EE0] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 dark:bg-[#FFD54A] dark:text-[#1C1633]"
                  >
                    <Store className="size-3.5" />
                    Ir a Cobros
                    <ArrowRight className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={changingType}
                  onClick={async () => {
                    setChangingType(true);
                    const nextType = isMerchant ? 'personal' : 'merchant';
                    try {
                      await setAccountType(nextType);
                      useNotificationStore.getState().notify({
                      title: nextType === 'merchant' ? '¡Modalidad Vendedor activada!' : 'Modalidad Personal activada',
                      description: nextType === 'merchant'
                        ? 'Tu perfil vendedor quedó guardado. Ya podés usar Cobros e Integraciones.'
                        : 'Volviste al modo de cuenta personal.',
                      type: 'transfer',
                    });
                    } catch (error) {
                      useNotificationStore.getState().notify({ title: 'No pudimos cambiar la modalidad', description: error.message });
                    } finally { setChangingType(false); }
                  }}
                  className="m-0 rounded-full border border-[#5B2EE0] px-3 py-1.5 text-xs font-semibold text-[#5B2EE0] transition-colors hover:bg-[#5B2EE0]/10 dark:border-[#FFD54A] dark:text-[#FFD54A] dark:hover:bg-[#FFD54A]/10"
                >
                  {isMerchant ? 'Pasar a Personal' : 'Activar Vendedor'}
                </button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              aria-expanded={showAccountDetails}
              onClick={() => setShowAccountDetails(prev => !prev)}
              className="m-0 flex w-full items-center justify-between gap-3 rounded-[24px] border-0 bg-white p-5 text-left shadow-[0_14px_32px_-22px_rgba(28,22,51,0.14)] transition-colors hover:bg-[#FAF9FE] lg:rounded-[28px] lg:px-7 dark:bg-[#140F24] dark:shadow-none dark:hover:bg-[#19122C]"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FFD54A]/25 text-[#7A5400] dark:bg-[#FFD54A]/15 dark:text-[#FFD54A]">
                  <CreditCard className="size-5 stroke-[2.2]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#1C1633] sm:text-base dark:text-[#F4F2FA]">
                    Datos para recibir dinero
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#6E6888] dark:text-[#9D97B5]">
                    CVU y Alias de tu cuenta
                  </span>
                </div>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F3F1F9] px-3.5 py-1.5 text-xs font-semibold text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#FFD54A]">
                {showAccountDetails ? (
                  <>
                    <EyeOff className="size-3.5" aria-hidden="true" />
                    <span>Ocultar datos</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5" aria-hidden="true" />
                    <span>Ver datos</span>
                  </>
                )}
              </span>
            </button>

            {showAccountDetails && (
              <div className={`animate-page-enter ${profilePanelClass}`}>
                <AccountDetails cvu={summary.account.cvu} alias={summary.account.alias} />
              </div>
            )}
          </div>
        </div>

        <section
          aria-labelledby="preferences-title"
          className={`flex h-full flex-col justify-between gap-5 ${profilePanelClass}`}
        >
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#FFD54A]">
                  <ThemeIcon className="size-4 stroke-[2.2]" aria-hidden="true" />
                </span>
                <h2 id="preferences-title" className={`${sectionTitleClass} m-0 tracking-tight`}>
                  Preferencias
                </h2>
              </div>
              <span className="rounded-full bg-[#F3F1F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#4C1DB8] dark:bg-[#1E1735] dark:text-[#C4B2FF]">
                Configuración
              </span>
            </div>

            <div className="rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="block text-sm font-bold text-[#1C1633] dark:text-[#F4F2FA]">
                    Modo oscuro
                  </span>
                  <span className="mt-0.5 block text-xs text-[#6E6888] dark:text-[#9D97B5]">
                    Alterná entre la interfaz clara y la estética OLED nocturna
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  aria-label="Modo oscuro"
                  onClick={toggleTheme}
                  className={`m-0 inline-flex h-8 w-14 shrink-0 items-center rounded-full border-0 p-1 transition-colors ${
                    isDark ? 'bg-[#5B2EE0]' : 'bg-[#DDD6F3]'
                  }`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full bg-white text-[#4C1DB8] shadow-xs transition-transform ${
                      isDark ? 'translate-x-6 bg-[#FFD54A] text-[#1C1633]' : ''
                    }`}
                  >
                    <ThemeIcon className="size-3.5" aria-hidden="true" />
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                  <Lock className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-sm font-bold text-[#1C1633] dark:text-[#F4F2FA]">
                    Protección de sesión
                  </span>
                  <span className="mt-0.5 block text-xs text-[#6E6888] dark:text-[#9D97B5]">
                    Token criptográfico y cierre automático activos
                  </span>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                Activo
              </span>
            </div>
          </div>

          <div className="border-t border-[#ECE9F5] pt-4 dark:border-[#261E3D]">
            <p className="m-0 text-xs font-semibold text-[#1C1633] dark:text-[#F4F2FA]">
              Sesión activa en este navegador
            </p>
            <p className="m-0 mt-0.5 mb-3 text-xs text-[#6E6888] dark:text-[#9D97B5]">
              Finalizá la sesión de forma segura si compartís este equipo.
            </p>
            <button
              type="button"
              onClick={signOut}
              className="m-0 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-0 bg-rose-50 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/65"
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AppLayout
      header={() => (
        <PageHeader
          title="Mi perfil"
          subtitle="Tus datos y la configuración de tu cuenta."
          showProfile={false}
        />
      )}
    >
      {summary => <ProfileContent summary={summary} />}
    </AppLayout>
  );
}
