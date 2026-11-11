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
import OpenRenaperModal from './OpenRenaperModal.jsx';

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
  const [showRenaperModal, setShowRenaperModal] = useState(false);

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
        setTimeout(() => setShowRenaperModal(true), 350);
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
            <IdCard className="size-3.5 text-[#5B2EE0]" />
          )}
          <span>Dorso</span>
          {backCaptured && (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      <div className="relative mx-auto h-48 w-full overflow-hidden rounded-2xl bg-[#090613] shadow-md ring-1 ring-[#261E3D]">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-gradient-to-b from-[#1C1633] via-[#120E24] to-[#090613] text-white">
            <div className="flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <Camera className="size-5 text-[#FFD54A]" />
            </div>
            <p className="mt-2 mb-0 text-[11px] font-medium text-white/70">
              Vista previa de cámara
            </p>
          </div>
        )}

        <svg
          className="pointer-events-none absolute inset-0 size-full"
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="dni-cutout-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x="8%"
                y="10%"
                width="84%"
                height="80%"
                rx="14"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(9, 6, 19, 0.68)"
            mask="url(#dni-cutout-mask)"
          />
        </svg>

        <div className="pointer-events-none absolute inset-y-[10%] inset-x-[8%] rounded-[14px]">
          <div
            className={cn(
              'size-full rounded-[14px] border-2 transition-all duration-300',
              isCurrentSideCaptured
                ? 'border-emerald-400/90 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : isScanning
                  ? 'border-[#FFD54A] shadow-[0_0_15px_rgba(255,213,74,0.4)]'
                  : 'border-white/60'
            )}
          >
            <span className="absolute -top-0.5 -left-0.5 size-4 rounded-tl-[12px] border-t-3 border-l-3 border-[#FFD54A]" />
            <span className="absolute -top-0.5 -right-0.5 size-4 rounded-tr-[12px] border-t-3 border-r-3 border-[#FFD54A]" />
            <span className="absolute -bottom-0.5 -left-0.5 size-4 rounded-bl-[12px] border-b-3 border-l-3 border-[#FFD54A]" />
            <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-br-[12px] border-b-3 border-r-3 border-[#FFD54A]" />

            {side === 'front' ? (
              <div className="flex size-full items-center justify-between p-3.5 opacity-35">
                <div className="flex size-14 items-center justify-center rounded-xl border border-dashed border-white/80 bg-white/10">
                  <User className="size-7 text-white" />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 pl-3">
                  <div className="h-2 w-20 rounded-full bg-white/70" />
                  <div className="h-2 w-28 rounded-full bg-white/70" />
                  <div className="h-2 w-16 rounded-full bg-white/50" />
                  <div className="mt-1 h-2 w-24 rounded-full bg-white/40" />
                </div>
              </div>
            ) : (
              <div className="flex size-full flex-col justify-between p-3.5 opacity-35">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="h-1.5 w-16 rounded-full bg-white/70" />
                    <div className="h-1.5 w-24 rounded-full bg-white/50" />
                  </div>
                  <Fingerprint className="size-8 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(14)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-5 rounded-sm bg-white/70',
                        i % 2 === 0 ? 'w-1' : 'w-1.5'
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {isScanning && (
            <motion.div
              animate={{ y: [0, 140, 0] }}
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
        <div className="flex items-center gap-1.5 text-[11px] text-[#4A4560]">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>Servicio de validación provisto por OpenRENAPER</span>
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
            onClick={() => setShowRenaperModal(true)}
            className={primaryButtonClass}
          >
            Validar con OpenRENAPER
            <ShieldCheck className="size-4" />
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

      <OpenRenaperModal
        open={showRenaperModal}
        dni={dni}
        onContinue={() => {
          setShowRenaperModal(false);
          onComplete?.();
        }}
        onRetry={() => {
          setShowRenaperModal(false);
          setFrontCaptured(false);
          setBackCaptured(false);
          setSide('front');
        }}
        onOpenChange={setShowRenaperModal}
      />
    </div>
  );
}
