import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import openRenaperLogo from "@/assets/openrenaper-logo.png";
import { primaryButtonClass } from "./styles.js";

export default function OpenRenaperModal({
  open,
  dni = "",
  initialStatus = "validating",
  validationDuration = 1200,
  onContinue,
  onRetry,
  onOpenChange,
}) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!open) {
      setStatus(initialStatus);
      return;
    }

    if (status === "validating") {
      const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
      const delay = isTestEnv ? 40 : validationDuration;

      const timer = setTimeout(() => {
        if (dni === "00000000") {
          setStatus("error");
        } else {
          setStatus("success");
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [open, status, initialStatus, validationDuration, dni]);

  function handleContinue() {
    onContinue?.();
  }

  function handleRetry() {
    setStatus("validating");
    onRetry?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={status !== "validating"}
        className="max-w-[420px] overflow-hidden rounded-[32px] border border-[#ECE9F5] bg-white p-6 text-center shadow-2xl dark:border-[#261E3D] dark:bg-[#140F24]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="flex flex-col items-center"
        >
          <div className="mb-2 flex flex-col items-center gap-2">
            <div className="flex h-12 w-auto max-w-[210px] items-center justify-center rounded-2xl border border-[#ECE9F5] bg-white px-4 py-2 shadow-xs dark:border-white/10 dark:bg-white/95">
              <img
                src={openRenaperLogo}
                alt="OpenRENAPER"
                className="max-h-7 w-auto object-contain"
              />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5B2EE0]/10 px-3 py-1 text-[11px] font-semibold text-[#5B2EE0] dark:bg-[#5B2EE0]/20 dark:text-[#FFD54A]">
              <ShieldCheck className="size-3.5 shrink-0" />
              Servicio de validación provisto por OpenRENAPER
            </span>
          </div>

          {status === "validating" && (
            <div className="my-4 flex flex-col items-center">
              <div className="relative my-3 flex size-16 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#5B2EE0]/15 dark:bg-[#5B2EE0]/30" />
                <div className="relative flex size-14 items-center justify-center rounded-full bg-[#FAF8FE] shadow-inner dark:bg-[#1E1735]">
                  <Loader2 className="size-7 animate-spin text-[#5B2EE0] dark:text-[#FFD54A]" />
                </div>
              </div>
              <h2 className="m-0 text-[20px] font-bold tracking-tight text-[#2A0E7A] dark:text-[#F4F2FA]">
                Validando documento…
              </h2>
              <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[#4A4560] dark:text-[#9D97B5]">
                Estamos consultando el padrón nacional del Registro Nacional de las Personas para corroborar la autenticidad de tu DNI.
              </p>
              {dni && (
                <p className="mt-2.5 mb-0 font-mono text-xs font-semibold text-[#5B2EE0] dark:text-[#FFD54A]">
                  DNI: {dni}
                </p>
              )}
            </div>
          )}

          {status === "success" && (
            <div className="my-4 flex flex-col items-center">
              <div className="my-2 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-500/20 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="m-0 text-[20px] font-bold tracking-tight text-[#2A0E7A] dark:text-[#F4F2FA]">
                DNI validado con éxito
              </h2>
              <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[#4A4560] dark:text-[#9D97B5]">
                La identidad y autenticidad del documento fueron confirmadas correctamente ante los registros de OpenRENAPER.
              </p>
              {dni && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#FAF8FE] px-2.5 py-1 text-xs dark:bg-[#1E1735]">
                  <span className="text-[#8C87A3]">Documento verificado:</span>
                  <span className="font-mono font-semibold text-[#1C1633] dark:text-white">
                    {dni}
                  </span>
                </div>
              )}
              <Button
                type="button"
                onClick={handleContinue}
                className={`${primaryButtonClass} mt-4 h-11 text-[15px] dark:bg-[#5B2EE0] dark:hover:bg-[#6C3BF4]`}
              >
                Continuar a validación facial
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="my-4 flex flex-col items-center">
              <div className="my-2 flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-md shadow-red-500/20 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertCircle className="size-8" />
              </div>
              <h2 className="m-0 text-[20px] font-bold tracking-tight text-[#2A0E7A] dark:text-[#F4F2FA]">
                Validación no exitosa
              </h2>
              <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[#4A4560] dark:text-[#9D97B5]">
                Los datos del documento no pudieron ser autenticados ante OpenRENAPER. Por favor, volvé a capturar el DNI con buena iluminación.
              </p>
              <Button
                type="button"
                onClick={handleRetry}
                className={`${primaryButtonClass} mt-4 h-11 text-[15px] dark:bg-[#5B2EE0] dark:hover:bg-[#6C3BF4]`}
              >
                Reintentar captura de DNI
                <RotateCcw className="size-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
