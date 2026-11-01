import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-svh bg-[#3A1299] font-[Poppins] text-[#1C1633] lg:grid lg:place-items-center lg:bg-[#EFEBFB] lg:bg-[repeating-linear-gradient(135deg,transparent_0_70px,rgba(255,255,255,0.45)_70px_140px)] lg:p-4 dark:bg-[#090613] lg:dark:bg-[#090613] lg:dark:bg-[repeating-linear-gradient(135deg,transparent_0_70px,rgba(255,255,255,0.025)_70px_140px)] dark:text-[#F4F2FA]">
      <div className="lg:grid lg:h-[min(660px,calc(100svh-2rem))] lg:w-full lg:max-w-5xl lg:grid-cols-[1fr_1.05fr] lg:overflow-hidden lg:rounded-[32px] lg:bg-white lg:shadow-[0_30px_80px_-30px_rgba(58,18,153,0.35)] lg:dark:border lg:dark:border-[#261E3D] lg:dark:bg-[#140F24] lg:dark:shadow-[0_0_60px_-20px_rgba(91,46,224,0.35)]">
        <StripedPanel className="lg:order-2" />

        <div className="relative -mt-8 rounded-t-[32px] bg-white dark:bg-[#140F24] px-7 pt-9 pb-10 lg:order-1 lg:mt-0 lg:flex lg:flex-col lg:overflow-y-auto lg:rounded-none lg:px-12 lg:pt-7 lg:pb-6">
          <div className="hidden items-center justify-between lg:flex">
            <Wordmark className="dark:text-white" />
            <ThemeToggle />
          </div>
          <div className="mx-auto w-full max-w-sm lg:my-auto lg:py-4">
            {children}
          </div>
          <p className="mt-10 mb-0 text-center text-[11px] text-[#ABA6C2] lg:hidden dark:text-[#6B6485]">Entorno de pruebas · sin dinero real</p>
        </div>
      </div>
    </div>
  );
}

export function Wordmark({ light = false, className = '' }) {
  return (
    <span
      aria-label="padi"
      className={`inline-flex items-end text-[30px] leading-none font-bold tracking-[-0.05em] ${light ? 'text-white' : 'text-[#2A0E7A]'} ${className}`}
    >
      <span aria-hidden="true">padi</span>
      <span aria-hidden="true" className="mb-[0.1em] ml-[0.08em] size-[0.24em] rounded-full bg-[#FFD54A]" />
    </span>
  );
}

function StripedPanel({ className = '' }) {
  const stripes = [
    { left: '-20%', top: '-30%', width: '55%', color: '#4C1DB8' },
    { left: '20%', top: '-45%', width: '38%', color: '#5B2EE0' },
    { left: '48%', top: '-20%', width: '30%', color: '#6C3BF4' },
    { left: '70%', top: '10%', width: '40%', color: '#4C1DB8' },
    { left: '5%', top: '55%', width: '42%', color: '#5B2EE0' },
  ];
  return (
    <div className={`relative overflow-hidden bg-[#3A1299] px-7 pt-10 pb-16 text-white lg:m-3 lg:flex lg:flex-col lg:justify-end lg:rounded-[24px] lg:p-12 ${className}`}>
      {stripes.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none absolute h-[160%] rotate-[35deg] rounded-full"
          style={{ left: s.left, top: s.top, width: s.width, background: s.color }}
        />
      ))}

      <div className="relative">
        <div className="mb-10 flex items-center justify-between lg:hidden">
          <Wordmark light />
          <ThemeToggle variant="overlay" />
        </div>
        <p className="m-0 text-[34px] leading-[1.1] font-bold tracking-tight lg:text-[52px]">
          Tu plata,<br />al día.
        </p>
        <p className="mt-3 mb-0 max-w-xs text-sm text-white/75">
          Enviá, recibí y seguí cada movimiento desde un solo lugar.
        </p>
        <p className="mt-8 mb-0 hidden text-[11px] text-white/50 lg:block">Entorno de pruebas · sin dinero real</p>
      </div>
    </div>
  );
}
