import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Fingerprint,
  IdCard,
  Loader2,
  RotateCcw,
  ShieldCheck,
  User,
  VideoOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';
import { Divider } from './LoginForm.jsx';
import { primaryButtonClass, secondaryButtonClass } from './styles.js';

export default function DniScanStep({
  onComplete,
  onBack,
  onCancel,
  backLabel = 'Volver a contraseña',
  dni = '',
}) {
  const [side, setSide] = useState('front');
  const [frontCaptured, setFrontCaptured] = useState(false);
  const [backCaptured, setBackCaptured] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 420 },
          },
          audio: false,
        })
        .then(stream => {
          if (!mounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = stream;
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          if (mounted) setCameraActive(false);
        });
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive, side]);

  function handleCapture() {
    setIsScanning(true);
    setTimeout(() => {
      if (side === 'front') {
        setFrontCaptured(true);
        setIsScanning(false);
        if (!backCaptured) {
          setTimeout(() => setSide('back'), 350);
        }
      } else {
        setBackCaptured(true);
        setIsScanning(false);
      }
    }, 1200);
  }

  function handleRetake() {
    if (side === 'front') {
      setFrontCaptured(false);
    } else {
      setBackCaptured(false);
    }
  }

  const isCurrentSideCaptured = side === 'front' ? frontCaptured : backCaptured;
  const bothSidesCaptured = frontCaptured && backCaptured;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
      >
        <ArrowLeft className="size-3.5" />
        {backLabel}
      </button>

      <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#2A0E7A] lg:text-[24px]">
        Validá tu DNI
      </h1>
      <p className="mt-0.5 mb-2.5 text-xs text-[#8C87A3]">
        Ubicá tu documento dentro del marco transparente de la cámara.
      </p>

      <div className="mb-2.5 flex items-center gap-1.5 rounded-xl bg-[#F3F1F9] p-1">
        <button
          type="button"
          onClick={() => setSide('front')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-semibold transition-all',
            side === 'front'
              ? 'bg-white text-[#2A0E7A] shadow-sm'
              : 'text-[#6B6485] hover:text-[#2A0E7A]'
          )}
        >
          {frontCaptured ? (
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          ) : (
            <IdCard className="size-3.5 text-[#5B2EE0]" />
          )}
          <span>Frente</span>
          {frontCaptured && (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSide('back')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-semibold transition-all',
            side === 'back'
              ? 'bg-white text-[#2A0E7A] shadow-sm'
              : 'text-[#6B6485] hover:text-[#2A0E7A]'
          )}
        >
          {backCaptured ? (
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          ) : (
            <Fingerprint className="size-3.5 text-[#5B2EE0]" />
          )}
          <span>Dorso</span>
          {backCaptured && (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#090613] shadow-md">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-[#1F1738] to-[#120B24] p-4 text-center">
            <div className="relative mb-3 flex size-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
              <IdCard className="size-7 text-[#FFD54A]" />
              <VideoOff className="absolute -top-1 -right-1 size-4 text-white/60" />
            </div>
            <p className="m-0 text-xs font-semibold text-white">
              Cámara no disponible
            </p>
            <p className="mt-1 mb-0 max-w-[240px] text-[11px] text-white/60">
              Podés continuar usando la simulación de escaneo para completar el
              registro.
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="relative aspect-[1.586/1] w-[88%] max-w-[320px] rounded-xl border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(9,6,19,0.55)]">
            <div className="absolute -top-1 -left-1 size-3.5 rounded-tl-sm border-t-2 border-l-2 border-[#FFD54A]" />
            <div className="absolute -top-1 -right-1 size-3.5 rounded-tr-sm border-t-2 border-r-2 border-[#FFD54A]" />
            <div className="absolute -bottom-1 -left-1 size-3.5 rounded-bl-sm border-b-2 border-l-2 border-[#FFD54A]" />
            <div className="absolute -bottom-1 -right-1 size-3.5 rounded-br-sm border-b-2 border-r-2 border-[#FFD54A]" />

            <div className="absolute inset-0 flex flex-col justify-between p-2.5 text-[9px] text-white/60">
              <div className="flex items-center justify-between">
                <span className="font-semibold tracking-wider uppercase text-white/80">
                  {side === 'front' ? 'DNI · Frente' : 'DNI · Dorso'}
                </span>
                <span className="font-mono text-[8px]">REPÚBLICA ARGENTINA</span>
              </div>

              {side === 'front' ? (
                <div className="flex items-end justify-between">
                  <div className="flex size-10 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20">
                    <User className="size-5 text-white/70" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="h-1.5 w-16 rounded-full bg-white/30" />
                    <div className="h-1.5 w-20 rounded-full bg-white/30" />
                    <div className="h-1.5 w-12 rounded-full bg-[#FFD54A]/70" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded bg-white/10 ring-1 ring-white/20">
                      <Fingerprint className="size-4 text-white/70" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-white/30" />
                      <div className="h-1.5 w-3/4 rounded-full bg-white/30" />
                    </div>
                  </div>
                  <div className="rounded bg-white/5 p-1 font-mono text-[7px] tracking-widest text-white/50">
                    IDARG&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                  </div>
                </div>
              )}
            </div>
          </div>

          {!cameraActive && (
            <p className="mt-2 mb-0 text-[11px] font-medium text-white/70">
              Vista previa de cámara
            </p>
          )}

          {isScanning && (
            <motion.div
              initial={{ top: '10%' }}
              animate={{ top: '90%' }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#FFD54A] to-transparent shadow-[0_0_12px_#FFD54A]"
            />
          )}

          {isCurrentSideCaptured && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
              <CheckCircle2 className="size-9 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span className="mt-1 text-xs font-semibold text-white">
                {side === 'front' ? 'Frente capturado' : 'Dorso capturado'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-[#6B6485] dark:text-[#9D97B5]">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Servicio provisto por OpenRENAPER</span>
        </div>

        {isCurrentSideCaptured && (
          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-[#5B2EE0] hover:text-[#3D1499]"
          >
            <RotateCcw className="size-3" />
            Reintentar
          </button>
        )}
      </div>

      <div className="mt-2.5">
        {!bothSidesCaptured ? (
          <Button
            type="button"
            onClick={handleCapture}
            disabled={isScanning || isCurrentSideCaptured}
            className={primaryButtonClass}
          >
            {isScanning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            {isScanning
              ? 'Escaneando documento…'
              : isCurrentSideCaptured
                ? 'Lado completado'
                : side === 'front'
                  ? 'Capturar frente del DNI'
                  : 'Capturar dorso del DNI'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onComplete}
            className={primaryButtonClass}
          >
            Continuar a validación facial
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      {onCancel && (
        <>
          <Divider />
          <Button
            type="button"
            onClick={onCancel}
            className={secondaryButtonClass}
          >
            Ya tengo cuenta
          </Button>
        </>
      )}
    </div>
  );
}
