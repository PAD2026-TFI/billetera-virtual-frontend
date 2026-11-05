import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';
import { Divider } from './LoginForm.jsx';
import { primaryButtonClass, secondaryButtonClass } from './styles.js';

export default function FacialScanStep({
  onComplete,
  onBack,
  onCancel,
  isSubmitting = false,
  completeLabel = 'Finalizar registro',
}) {
  const [status, setStatus] = useState('idle');
  const [prompt, setPrompt] = useState('Centrá tu rostro dentro del óvalo guía');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
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
  }, [cameraActive]);

  function handleStartScan() {
    setStatus('scanning');
    setPrompt('Mirá fijamente al centro...');
    setTimeout(() => {
      setPrompt('Mantené la mirada fija...');
    }, 700);
    setTimeout(() => {
      setPrompt('Verificando prueba de vida...');
    }, 1400);
    setTimeout(() => {
      setStatus('success');
      setPrompt('¡Identidad confirmada!');
    }, 2200);
  }

  function handleRetake() {
    setStatus('idle');
    setPrompt('Centrá tu rostro dentro del óvalo guía');
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
      >
        <ArrowLeft className="size-3.5" />
        Volver a escaneo de DNI
      </button>

      <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#2A0E7A] lg:text-[24px]">
        Validación facial
      </h1>
      <p className="mt-0.5 mb-2.5 text-xs text-[#8C87A3]">
        Alineá tu cara con la silueta guía para confirmar tu identidad.
      </p>

      <div className="relative mx-auto h-52 w-full overflow-hidden rounded-2xl bg-[#090613] shadow-md ring-1 ring-[#261E3D]">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="size-full -scale-x-100 object-cover"
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
            <mask id="face-cutout-mask">
              <rect width="100%" height="100%" fill="white" />
              <ellipse cx="50%" cy="50%" rx="32%" ry="44%" fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(9, 6, 19, 0.68)"
            mask="url(#face-cutout-mask)"
          />
        </svg>

        <div className="pointer-events-none absolute inset-y-[6%] inset-x-[18%] flex items-center justify-center">
          <div
            className={cn(
              'relative size-full rounded-[68px] border-2 transition-all duration-300',
              status === 'success'
                ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] ring-4 ring-emerald-400/25'
                : status === 'scanning'
                  ? 'border-[#FFD54A] shadow-[0_0_20px_rgba(255,213,74,0.45)] ring-4 ring-[#FFD54A]/20'
                  : 'border-white/60'
            )}
          >
            <svg
              className="absolute inset-0 size-full p-2 opacity-35"
              viewBox="0 0 100 130"
              fill="none"
            >
              <ellipse
                cx="50"
                cy="58"
                rx="34"
                ry="46"
                stroke="white"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle cx="36" cy="50" r="3" fill="white" />
              <circle cx="64" cy="50" r="3" fill="white" />
              <line
                x1="30"
                y1="50"
                x2="70"
                y2="50"
                stroke="white"
                strokeWidth="0.75"
                strokeDasharray="2 2"
              />
              <path
                d="M50 54 L50 64 L46 68"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M40 78 Q50 85 60 78"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M18 126 C28 108 72 108 82 126"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            {status === 'scanning' && (
              <motion.div
                animate={{ y: [-70, 70, -70] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-transparent via-[#FFD54A] to-transparent shadow-[0_0_12px_#FFD54A]"
              />
            )}

            {status === 'success' && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-[66px] bg-black/40 backdrop-blur-[1px]">
                <CheckCircle2 className="size-11 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                <span className="mt-1 text-xs font-semibold text-emerald-300">
                  Rostro verificado
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="rounded-xl bg-[#F8F6FD] px-3 py-1.5 text-xs font-medium text-[#4A4560]">
          {prompt}
        </div>

        {status === 'success' && (
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
        {status !== 'success' ? (
          <Button
            type="button"
            onClick={handleStartScan}
            disabled={status === 'scanning'}
            className={primaryButtonClass}
          >
            {status === 'scanning' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ScanFace className="size-4" />
            )}
            {status === 'scanning'
              ? 'Verificando rostro…'
              : 'Iniciar escaneo facial'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onComplete}
            disabled={isSubmitting}
            className={primaryButtonClass}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? 'Creando cuenta…' : completeLabel}
            {!isSubmitting && <ArrowRight className="size-4" />}
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
