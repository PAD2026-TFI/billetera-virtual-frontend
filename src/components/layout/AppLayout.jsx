import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import ThemeToggle from '@/components/common/ThemeToggle';
import ProfileButton from '@/components/common/ProfileButton';
import { useWalletStore } from '@/store/useWalletStore';

const bandStripes = [
  { left: '8%', width: '18%', color: '#4C1DB8' },
  { left: '34%', width: '12%', color: '#5B2EE0' },
  { left: '58%', width: '22%', color: '#4C1DB8' },
  { left: '88%', width: '16%', color: '#5B2EE0' },
];

export const panelClass =
  'rounded-[24px] bg-white p-5 dark:bg-[#140F24] lg:rounded-[28px] lg:p-7 lg:shadow-[0_24px_60px_-32px_rgba(58,18,153,0.35)] lg:dark:border lg:dark:border-[#261E3D] lg:dark:bg-[#140F24] lg:dark:shadow-none';

export default function AppLayout({ header, children }) {
  const { summary, status, loadSummary } = useWalletStore();

  useEffect(() => {
    if (status === 'idle') loadSummary();
  }, [status, loadSummary]);

  return (
    <div className="flex min-h-svh bg-[#F8F7FD] font-[Poppins] text-[#1C1633] lg:bg-[#F1EEFA] dark:bg-[#090613] dark:text-[#F4F2FA]">
      <Sidebar />

      <div className="relative min-w-0 flex-1 overflow-x-hidden pb-28 lg:pb-10">
        <div aria-hidden="true" className="pointer-events-none absolute -top-[420px] left-1/2 size-[820px] -translate-x-1/2 rounded-full bg-[#E6DFFB] lg:hidden dark:bg-[#140F24]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 hidden h-64 overflow-hidden bg-[#3A1299] lg:block">
          {bandStripes.map(stripe => (
            <span
              key={stripe.left}
              className="absolute -top-1/2 h-[260%] rotate-[35deg] rounded-full"
              style={{ left: stripe.left, width: stripe.width, background: stripe.color }}
            />
          ))}
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8 lg:px-10 lg:pt-10">
          {status === 'error' && (
            <div role="alert" className="rounded-[20px] bg-white p-6 dark:bg-[#140F24]">
              <p className="m-0 font-semibold">No pudimos cargar tu billetera.</p>
              <button type="button" onClick={loadSummary} className="m-0 mt-4 h-11 rounded-full border-0 bg-[#4C1DB8] px-5 text-sm font-semibold text-white">
                Reintentar
              </button>
            </div>
          )}

          {status !== 'error' && !summary && <LayoutSkeleton />}

          {summary && (
            <>
              {header(summary)}
              <main className="m-0 mt-7 max-w-none p-0 lg:mt-10">{children(summary)}</main>
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export function PageHeader({ title, subtitle, showProfile = true }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <h1 className="m-0 text-[28px] leading-tight font-bold tracking-tight lg:text-[32px] lg:text-white">{title}</h1>
        {subtitle && <p className="mt-1 mb-0 text-sm text-[#4A4560] lg:text-white/75 dark:text-[#9D97B5] lg:dark:text-white/75">{subtitle}</p>}
      </div>
      <div className="flex gap-2 lg:hidden">
        <ThemeToggle />
        {showProfile && <ProfileButton />}
      </div>
    </header>
  );
}

function LayoutSkeleton() {
  const block = 'animate-pulse bg-[#E2DCF5] dark:bg-[#1E1735]';
  return (
    <div aria-busy="true" aria-label="Cargando tu billetera">
      <div className={`h-14 w-64 rounded-xl ${block} lg:bg-white/20`} />
      <div className="mt-7 grid gap-7 lg:mt-10 lg:grid-cols-[380px_1fr] lg:gap-8">
        <div className={`h-[520px] rounded-[28px] ${block}`} />
        <div className={`h-[520px] rounded-[28px] ${block}`} />
      </div>
    </div>
  );
}
