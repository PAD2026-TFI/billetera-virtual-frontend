import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import coinImg from '../../assets/coin.webp';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

export default function AuthLayout({ children }) {
  const isDesktop = useIsDesktop();

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#3A1299] font-[Poppins] text-[#1C1633] lg:grid lg:place-items-center lg:bg-[#EFEBFB] lg:bg-[repeating-linear-gradient(135deg,transparent_0_70px,rgba(255,255,255,0.45)_70px_140px)] lg:p-4">
      <div className="relative flex h-svh w-full flex-col overflow-hidden lg:grid lg:h-[min(660px,calc(100svh-2rem))] lg:min-h-0 lg:max-w-5xl lg:grid-cols-[1fr_1.05fr] lg:overflow-hidden lg:rounded-[32px] lg:bg-white lg:shadow-[0_30px_80px_-30px_rgba(58,18,153,0.35)]">
        <StripedPanel isDesktop={isDesktop} />

        <motion.div
          initial={isDesktop ? { opacity: 0 } : { y: '100%' }}
          animate={isDesktop ? { opacity: 1 } : { y: 0 }}
          transition={
            isDesktop
              ? { duration: 0.7, delay: 0.35 }
              : { type: 'spring', damping: 28, stiffness: 65, mass: 1.15, delay: 0.25 }
          }
          className="relative z-20 mt-auto flex h-[calc(100svh-116px)] flex-col justify-between overflow-y-auto rounded-t-[32px] bg-white px-6 pt-7 pb-6 shadow-[0_-15px_40px_rgba(0,0,0,0.25)] lg:order-1 lg:mt-0 lg:h-full lg:overflow-y-auto lg:rounded-none lg:px-12 lg:pt-8 lg:pb-6 lg:shadow-none"
        >
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-2 lg:my-auto lg:py-2">
            <div className="hidden lg:mb-6 lg:block">
              <Wordmark />
            </div>
            {children}
          </div>
          <p className="mt-4 mb-0 text-center text-[11px] text-[#ABA6C2]">
            Entorno de pruebas · sin dinero real
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function Wordmark({ light = false, className = '' }) {
  return (
    <span
      aria-label="padi"
      className={`inline-flex items-end text-[28px] font-bold leading-none tracking-[-0.05em] lg:text-[32px] ${light ? 'text-white' : 'text-[#2A0E7A]'} ${className}`}
    >
      <span aria-hidden="true">padi</span>
      <span aria-hidden="true" className="mb-[0.1em] ml-[0.08em] size-[0.24em] rounded-full bg-[#FFD54A]" />
    </span>
  );
}

function StripedPanel({ isDesktop = false }) {
  const stripes = [
    { left: '-20%', top: '-30%', width: '55%', color: '#4C1DB8' },
    { left: '20%', top: '-45%', width: '38%', color: '#5B2EE0' },
    { left: '48%', top: '-20%', width: '30%', color: '#6C3BF4' },
    { left: '70%', top: '10%', width: '40%', color: '#4C1DB8' },
    { left: '5%', top: '55%', width: '42%', color: '#5B2EE0' },
  ];

  return (
    <motion.div
      initial={isDesktop ? { x: '-100%' } : false}
      animate={isDesktop ? { x: 0 } : false}
      transition={
        isDesktop
          ? { duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.2 }
          : undefined
      }
      className="absolute inset-0 z-0 overflow-hidden bg-[#3A1299] px-6 pt-7 text-white lg:relative lg:order-2 lg:m-3 lg:flex lg:flex-col lg:justify-center lg:rounded-[24px] lg:p-12"
    >
      {stripes.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none absolute h-[160%] rotate-[35deg] rounded-full"
          style={{ left: s.left, top: s.top, width: s.width, background: s.color }}
        />
      ))}

      <div className="relative z-10 lg:my-auto">
        <div className="mb-1 lg:hidden">
          <Wordmark light />
          <p className="mt-0.5 mb-0 text-xs font-semibold tracking-wider text-white/80 uppercase">
            Pagos al día
          </p>
        </div>

        <div className="hidden lg:mb-5 lg:block">
          <motion.div
            initial={{ y: -160, opacity: 0, rotate: -25, scale: 0.65 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            transition={{
              type: 'spring',
              damping: 13,
              stiffness: 85,
              mass: 1.1,
              delay: 0.75,
            }}
            className="w-fit"
          >
            <motion.img
              src={coinImg}
              alt="Moneda padi"
              animate={{
                y: [0, -9, 0],
                rotate: [-8, -4, -8],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.6,
              }}
              style={{ rotate: -8 }}
              className="size-22 select-none pointer-events-none drop-shadow-[0_14px_28px_rgba(255,213,74,0.38)]"
            />
          </motion.div>
        </div>

        <p className="m-0 text-[22px] font-bold leading-tight tracking-tight text-white whitespace-nowrap sm:text-[26px] lg:whitespace-normal lg:text-[52px] lg:leading-[1.1]">
          Tu plata, <br className="hidden lg:block" />al día.
        </p>
        <p className="mt-2 mb-0 max-w-xs text-sm text-white/75 leading-relaxed">
          Enviá, recibí y seguí cada movimiento desde un solo lugar.
        </p>
      </div>

      <p className="relative z-10 mb-0 hidden text-[11px] text-white/50 lg:absolute lg:bottom-6 lg:left-12 lg:block">
        Entorno de pruebas · sin dinero real
      </p>
    </motion.div>
  );
}
