import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, RotateCw } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import ThemeToggle from '@/components/common/ThemeToggle';
import ProfileButton from '@/components/common/ProfileButton';
import { sectionFromPath } from '@/lib/routes';
import { useWalletStore } from '@/store/useWalletStore';

const bandStripes = [
  { left: '8%', width: '18%', color: '#4C1DB8' },
  { left: '34%', width: '12%', color: '#5B2EE0' },
  { left: '58%', width: '22%', color: '#4C1DB8' },
  { left: '88%', width: '16%', color: '#5B2EE0' },
];

let globalPreviousSnapshot = null;

const navIndexMap = {
  home: 0,
  movements: 1,
  pay: 2,
  transfer: 3,
  card: 4,
  collections: 5,
  topUp: 6,
  profile: 7,
  sandbox: 8,
};

export const panelClass =
  'rounded-[24px] bg-white p-5 dark:bg-[#140F24] lg:rounded-[28px] lg:p-7 lg:shadow-[0_24px_60px_-32px_rgba(58,18,153,0.35)] lg:dark:border lg:dark:border-[#261E3D] lg:dark:bg-[#140F24] lg:dark:shadow-none';

export default function AppLayout({ header, children, fitViewportMobile = false }) {
  const { summary, status, loadSummary } = useWalletStore();
  const location = useLocation();
  const currentSection = sectionFromPath(location.pathname);
  const isTest = import.meta.env.MODE === 'test';

  const [transitionState, setTransitionState] = useState(() => {
    if (isTest || !globalPreviousSnapshot || globalPreviousSnapshot.section === currentSection) {
      return { outgoing: null, direction: 'none' };
    }
    const prevIdx = navIndexMap[globalPreviousSnapshot.section] ?? 0;
    const currIdx = navIndexMap[currentSection] ?? 0;
    const direction = currIdx >= prevIdx ? 'forward' : 'backward';
    return {
      outgoing: globalPreviousSnapshot.content,
      direction,
    };
  });

  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (status === 'idle') loadSummary();
  }, [status, loadSummary]);

  useEffect(() => {
    if (transitionState.outgoing) {
      const timer = setTimeout(() => {
        setTransitionState({ outgoing: null, direction: 'idle' });
      }, 330);
      return () => clearTimeout(timer);
    }
  }, [transitionState.outgoing]);

  function handleTouchStart(e) {
    if (window.scrollY <= 0 && !refreshing) {
      touchStartRef.current = e.touches[0].clientY;
    }
  }

  function handleTouchMove(e) {
    if (touchStartRef.current === null || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    if (diff > 0 && window.scrollY <= 0) {
      setPullY(Math.min(diff * 0.45, 80));
    }
  }

  async function handleTouchEnd() {
    if (touchStartRef.current === null || refreshing) return;
    const shouldRefresh = pullY >= 50;
    touchStartRef.current = null;
    if (shouldRefresh) {
      setRefreshing(true);
      setPullY(60);
      try {
        await loadSummary();
      } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  }

  const renderSlot = (slot, arg) => (typeof slot === 'function' ? slot(arg) : slot);

  const currentSlideContent = summary ? (
    <>
      {renderSlot(header, summary)}
      <main
        className={`m-0 ${
          fitViewportMobile ? 'mt-2 flex flex-1 min-h-0 flex-col lg:mt-10' : 'mt-7 lg:mt-10'
        } max-w-none p-0 flex-1 min-h-0`}
      >
        {renderSlot(children, summary)}
      </main>
    </>
  ) : null;

  useEffect(() => {
    if (summary && !isTest) {
      globalPreviousSnapshot = {
        section: currentSection,
        content: currentSlideContent,
      };
    }
  }, [summary, currentSection, currentSlideContent, isTest]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex min-h-svh bg-[#F8F7FD] font-[Poppins] text-[#1C1633] lg:bg-[#F1EEFA] dark:bg-[#090613] dark:text-[#F4F2FA]"
    >
      <Sidebar />

      {(pullY > 0 || refreshing) && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#ECE9F5] bg-white/95 px-4 py-2 text-xs font-semibold text-[#4C1DB8] shadow-[0_8px_24px_rgba(76,29,184,0.25)] backdrop-blur-md lg:hidden dark:border-[#261E3D] dark:bg-[#140F24]/95 dark:text-[#B9A6FF]"
        >
          {refreshing ? (
            <>
              <Loader2 className="size-4 animate-spin text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
              <span>Actualizando billetera…</span>
            </>
          ) : (
            <>
              <RotateCw
                className="size-4 transition-transform duration-100"
                style={{ transform: `rotate(${Math.min(pullY * 4, 360)}deg)` }}
                aria-hidden="true"
              />
              <span>{pullY >= 50 ? 'Soltá para actualizar' : 'Deslizá para actualizar'}</span>
            </>
          )}
        </div>
      )}

      <div
        className={`relative min-w-0 flex-1 overflow-x-hidden ${
          fitViewportMobile
            ? 'flex h-svh max-h-svh flex-col overflow-hidden pb-20 lg:h-auto lg:max-h-none lg:overflow-visible lg:pb-10'
            : 'pb-28 lg:pb-10'
        }`}
      >
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

        <div
          className={`relative mx-auto w-full max-w-6xl ${
            fitViewportMobile
              ? 'flex h-full flex-1 min-h-0 flex-col px-4 pt-3 pb-2 sm:px-6 lg:h-auto lg:px-10 lg:pt-10 lg:pb-0'
              : 'px-5 pt-6 sm:px-8 lg:px-10 lg:pt-10'
          }`}
        >
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
            <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              {transitionState.outgoing && (
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 z-0 flex h-full w-full flex-col overflow-hidden ${
                    transitionState.direction === 'forward'
                      ? 'animate-slide-push-out-left'
                      : 'animate-slide-push-out-right'
                  }`}
                >
                  {transitionState.outgoing}
                </div>
              )}
              <div
                className={`relative z-10 flex min-h-0 w-full flex-1 flex-col ${
                  transitionState.direction === 'forward'
                    ? 'animate-slide-push-in-right'
                    : transitionState.direction === 'backward'
                    ? 'animate-slide-push-in-left'
                    : transitionState.direction === 'none'
                    ? 'animate-page-enter'
                    : ''
                }`}
              >
                {currentSlideContent}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export function PageHeader({ title, subtitle, showProfile = true, compactMobile = false }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <h1
          className={`m-0 leading-tight font-bold tracking-tight ${
            compactMobile ? 'text-lg lg:text-[32px]' : 'text-[28px] lg:text-[32px]'
          } lg:text-white`}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={`mt-1 mb-0 text-sm text-[#4A4560] lg:text-white/75 dark:text-[#9D97B5] lg:dark:text-white/75 ${
              compactMobile ? 'hidden lg:block' : ''
            }`}
          >
            {subtitle}
          </p>
        )}
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
