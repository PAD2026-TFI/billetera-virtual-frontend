import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Info, ShieldCheck, Wifi, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import coinImg from '../../assets/coin.webp';
import { Wordmark } from './AuthLayout.jsx';
import { primaryButtonClass } from './styles.js';

export default function RegisterSuccessModal({
  open,
  firstName,
  lastName,
  onContinue,
}) {
  const [isClosing, setIsClosing] = useState(false);

  function handleContinue() {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onContinue?.();
    }, 240);
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && handleContinue()}>
      <DialogContent
        showClose={false}
        className="max-w-[390px] overflow-hidden rounded-[32px] border-0 p-6 text-center shadow-2xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 22 }}
          animate={
            isClosing
              ? { opacity: 0, scale: 0.9, y: 16 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          transition={
            isClosing
              ? { duration: 0.22, ease: [0.32, 0, 0.67, 0] }
              : { type: 'spring', damping: 22, stiffness: 260, mass: 0.9 }
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
            className="relative mx-auto mb-4 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#4C1DB8] via-[#3A1299] to-[#1C1633] p-5 text-left text-white shadow-xl shadow-purple-950/25"
          >
            <div className="pointer-events-none absolute -top-6 -right-6 size-28 rounded-full bg-white/10 blur-xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-4 size-24 rounded-full bg-[#FFD54A]/20 blur-lg" />

            <div className="flex items-center justify-between">
              <Wordmark light className="text-[20px]" />
              <Wifi className="size-4.5 rotate-90 text-white/70" />
            </div>

            <div className="my-4 flex items-center justify-between">
              <div className="size-7 rounded-md bg-gradient-to-tr from-[#FFD54A] to-[#FFE664] opacity-90 shadow-sm" />
              <img
                src={coinImg}
                alt=""
                className="size-11 select-none drop-shadow-[0_6px_14px_rgba(255,213,74,0.4)]"
              />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="m-0 text-[10px] tracking-wider text-white/60 uppercase">
                  Titular
                </p>
                <p className="m-0 font-mono text-[13px] font-semibold tracking-wide text-white uppercase">
                  {firstName} {lastName}
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Cuenta activa
              </div>
            </div>
          </motion.div>

          <h2 className="m-0 text-[22px] font-bold tracking-tight text-[#2A0E7A] lg:text-[24px]">
            ¡Bienvenido a padi!
          </h2>
          <p className="mt-1.5 mb-3.5 text-[13.5px] leading-relaxed text-[#4A4560]">
            Hola{' '}
            <strong className="font-semibold text-[#1C1633]">
              {firstName}
            </strong>
            , tu billetera virtual ya está habilitada para enviar, recibir y transferir dinero.
          </p>

          <div className="mb-3 grid grid-cols-2 gap-2 text-left">
            <div className="rounded-xl bg-[#F3F1F9] p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A0E7A]">
                <Zap className="size-3.5 text-[#5B2EE0]" />
                Transferencias
              </div>
              <p className="mt-0.5 mb-0 text-[11px] text-[#8C87A3]">
                Inmediatas y sin costo
              </p>
            </div>

            <div className="rounded-xl bg-[#F3F1F9] p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A0E7A]">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Seguridad 24/7
              </div>
              <p className="mt-0.5 mb-0 text-[11px] text-[#8C87A3]">
                Fondos protegidos
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-[#FFD54A]/60 bg-[#FFF9E5] px-3.5 py-2.5 text-left">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[#FFD54A]/35 text-[#7A5400]">
              <Info className="size-3.5 stroke-[2.3]" aria-hidden="true" />
            </span>
            <p className="m-0 text-[11.5px] leading-snug text-[#5C4408]">
              <strong className="font-semibold text-[#3D2C04]">Entorno de prueba:</strong>{' '}
              padi. es una billetera virtual con fines académicos y demostrativos. No utiliza dinero real.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleContinue}
            className={`${primaryButtonClass} h-11 text-[15px]`}
          >
            Comenzar a operar
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
