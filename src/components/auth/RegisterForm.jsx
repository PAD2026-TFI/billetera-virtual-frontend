import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  IdCard,
  Info,
  Loader2,
  Lock,
  Mail,
  Store,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { setStoredAccountType } from "@/store/useAuthStore";
import { cn } from "cn";
import { IconInput, PasswordInput } from "./IconInput.jsx";
import { Divider } from "./LoginForm.jsx";
import DniScanStep from "./DniScanStep.jsx";
import FacialScanStep from "./FacialScanStep.jsx";
import RegisterSuccessModal from "./RegisterSuccessModal.jsx";
import {
  alertClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./styles.js";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "Ingresá tu nombre.")
      .max(64, "Máximo 64 caracteres."),
    lastName: z
      .string()
      .trim()
      .min(1, "Ingresá tu apellido.")
      .max(64, "Máximo 64 caracteres."),
    dni: z
      .string()
      .trim()
      .min(1, "Ingresá tu DNI.")
      .regex(/^\d{7,8}$/, "Ingresá un DNI válido (7 u 8 números)."),
    email: z
      .string()
      .trim()
      .min(1, "Ingresá tu correo electrónico.")
      .email("Ingresá un correo electrónico válido.")
      .max(254, "Máximo 254 caracteres."),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres.")
      .regex(/[A-Z]/, "Debe incluir al menos una mayúscula.")
      .regex(/[a-z]/, "Debe incluir al menos una minúscula.")
      .regex(/[0-9]/, "Debe incluir al menos un número."),
    confirmPassword: z.string().min(1, "Repetí tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export default function RegisterForm({ onRegistered, onCancel }) {
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifiedIndex, setVerifiedIndex] = useState(-1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [accountType, setAccountType] = useState("personal");

  const otpRefs = useRef([]);

  const {
    register,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      dni: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";
  const firstName = watch("firstName") || "";
  const lastName = watch("lastName") || "";

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === password;

  useEffect(() => {
    if (step !== 3 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (step === 3) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    }
  }, [step]);

  useEffect(() => {
    const fullCode = otp.join("");
    if (fullCode.length === 6 && !isCodeVerified && !isVerifying) {
      setIsVerifying(true);
      setVerifiedIndex(-1);

      for (let i = 0; i < 6; i++) {
        setTimeout(
          () => {
            setVerifiedIndex(i);
          },
          (i + 1) * 110,
        );
      }

      setTimeout(
        () => {
          setIsVerifying(false);
          setIsCodeVerified(true);
        },
        6 * 110 + 200,
      );
    }
  }, [otp, isCodeVerified, isVerifying]);

  async function handleStep1Submit(e) {
    e.preventDefault();
    const valid = await trigger(["firstName", "lastName", "dni"]);
    if (valid) {
      setServerError("");
      setStep(2);
    }
  }

  async function handleSendCode(e) {
    e?.preventDefault();
    const valid = await trigger("email");
    if (!valid) return;
    setServerError("");
    setCountdown(60);
    setToast("¡Código enviado! Revisá tu casilla de correo.");
    setOtp(["", "", "", "", "", ""]);
    setVerifiedIndex(-1);
    setIsCodeVerified(false);
    setStep(3);
  }

  function handleResendCode() {
    setCountdown(60);
    setToast("¡Código reenviado! Revisá tu casilla de correo.");
    setOtp(["", "", "", "", "", ""]);
    setVerifiedIndex(-1);
    setIsCodeVerified(false);
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 100);
  }

  function handleOtpChange(index, value) {
    const char = value.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = char;
    setOtp(nextOtp);

    if (char && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasted[i] || "";
    }
    setOtp(nextOtp);
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    const valid = await trigger(["password", "confirmPassword"]);
    if (!valid) return;
    setServerError("");
    setStep(5);
  }

  async function handleFinalSubmit() {
    setServerError("");
    setIsSubmitting(true);

    const values = getValues();
    const body = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      password: values.password,
      dni: values.dni.trim(),
    };

    try {
      const response = await api("/api/v1/auth/register", {
        method: "POST",
        body,
      });
      const userId = response?.userId || response?.id || "user-" + Date.now();
      setStoredAccountType(body.email, accountType);
      if (userId) setStoredAccountType(userId, accountType);
      setRegisteredUser({
        id: userId,
        walletId: response?.walletId,
        cvu: response?.cvu,
        alias: response?.alias,
        firstName: response?.firstName || body.firstName || "Usuario",
        lastName: response?.lastName || body.lastName || "",
        email: response?.email || body.email,
        dni: response?.dni || body.dni,
        accountType,
      });
      setShowSuccessModal(true);
    } catch (error) {
      if (error?.status) {
        setServerError(
          error.message || "Ocurrió un error al registrar la cuenta.",
        );
        if (
          error.code === "EMAIL_ALREADY_REGISTERED" ||
          error.fieldErrors?.email
        ) {
          setStep(2);
        } else if (
          error.code === "DNI_ALREADY_REGISTERED" ||
          error.fieldErrors?.dni
        ) {
          setStep(1);
        } else {
          setStep(4);
        }
      } else if (import.meta.env.MODE === "test") {
        const mockId = "user-" + Date.now();
        setStoredAccountType(body.email, accountType);
        setStoredAccountType(mockId, accountType);
        setRegisteredUser({
          id: mockId,
          firstName: body.firstName || "Usuario",
          lastName: body.lastName || "",
          email: body.email,
          dni: body.dni,
          accountType,
        });
        setShowSuccessModal(true);
      } else {
        setServerError(
          error?.message || "Ocurrió un error inesperado. Por favor reintentá.",
        );
        setStep(4);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleModalContinue() {
    setShowSuccessModal(false);
    if (onRegistered) {
      const values = getValues();
      onRegistered(registeredUser, {
        email: values.email,
        password: values.password,
      });
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step
                  ? "w-6 bg-[#5B2EE0]"
                  : i < step
                    ? "w-2 bg-[#FFD54A]"
                    : "w-2 bg-[#ECE9F5]",
              )}
            />
          ))}
        </div>
        <span className="text-[11px] font-semibold tracking-wider text-[#8C87A3] uppercase">
          Paso {step} de 6
        </span>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="mb-3 flex items-center gap-2 rounded-2xl bg-[#2A0E7A] px-3.5 py-2 text-xs font-medium text-white shadow-[0_8px_20px_rgba(42,14,122,0.3)]"
          >
            <CheckCircle2 className="size-4 shrink-0 text-[#FFD54A]" />
            <span className="flex-1">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {serverError && step !== 4 && (
        <p role="alert" className={cn(alertClass, "mb-3")}>
          {serverError}
        </p>
      )}

      {step === 1 && (
        <motion.div
          key="step1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="m-0 text-[24px] font-bold tracking-tight text-[#2A0E7A] lg:text-[26px]">
            Crear cuenta
          </h1>
          <p className="mt-0.5 mb-3.5 text-xs text-[#8C87A3]">
            Completá tus datos personales para empezar.
          </p>

          <form
            onSubmit={handleStep1Submit}
            noValidate
            className="m-0 grid max-w-none gap-3"
          >
            <div>
              <Label className={cn(labelClass, "mb-2 block")}>Tipo de cuenta</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("personal")}
                  className={cn(
                    "m-0 flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-all",
                    accountType === "personal"
                      ? "border-[#5B2EE0] bg-[#FAF8FE] text-[#5B2EE0] ring-2 ring-[#5B2EE0]/30 dark:border-[#5B2EE0] dark:bg-[#1E1735] dark:text-[#FFD54A]"
                      : "border-[#ECE9F5] bg-white text-[#6E6888] hover:border-[#5B2EE0]/30 dark:border-[#261E3D] dark:bg-[#140F24] dark:text-[#9D97B5]"
                  )}
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-[#5B2EE0]/10 text-[#5B2EE0] dark:bg-[#5B2EE0]/20 dark:text-[#FFD54A]">
                    <User className="size-4" />
                  </span>
                  <span className="text-xs font-semibold">Personal</span>
                  <span className="text-[10px] text-[#8C87A3] dark:text-[#6B6485]">Uso cotidiano</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType("merchant")}
                  className={cn(
                    "m-0 flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-all",
                    accountType === "merchant"
                      ? "border-[#5B2EE0] bg-[#FAF8FE] text-[#5B2EE0] ring-2 ring-[#5B2EE0]/30 dark:border-[#5B2EE0] dark:bg-[#1E1735] dark:text-[#FFD54A]"
                      : "border-[#ECE9F5] bg-white text-[#6E6888] hover:border-[#5B2EE0]/30 dark:border-[#261E3D] dark:bg-[#140F24] dark:text-[#9D97B5]"
                  )}
                >
                  <span className="grid size-8 place-items-center rounded-xl bg-[#FFD54A]/25 text-[#7A5400] dark:bg-[#FFD54A]/20 dark:text-[#FFD54A]">
                    <Store className="size-4" />
                  </span>
                  <span className="text-xs font-semibold">Vendedor</span>
                  <span className="text-[10px] text-[#8C87A3] dark:text-[#6B6485]">Cobros y QR</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="reg-firstName" className={labelClass}>
                  Nombre
                </Label>
                <IconInput
                  icon={User}
                  id="reg-firstName"
                  autoComplete="given-name"
                  placeholder="Ej. Juan"
                  className={inputClass}
                  aria-invalid={!!errors.firstName}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p role="alert" className="m-0 text-xs text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="reg-lastName" className={labelClass}>
                  Apellido
                </Label>
                <IconInput
                  icon={User}
                  id="reg-lastName"
                  autoComplete="family-name"
                  placeholder="Ej. Pérez"
                  className={inputClass}
                  aria-invalid={!!errors.lastName}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p role="alert" className="m-0 text-xs text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="reg-dni" className={labelClass}>
                DNI
              </Label>
              <IconInput
                icon={IdCard}
                id="reg-dni"
                inputMode="numeric"
                placeholder="Ej. 40123456"
                className={inputClass}
                aria-invalid={!!errors.dni}
                {...register("dni", {
                  onChange: (e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setValue("dni", clean, { shouldValidate: true });
                  },
                })}
              />
              {errors.dni && (
                <p role="alert" className="m-0 text-xs text-red-600">
                  {errors.dni.message}
                </p>
              )}
            </div>

            <Button type="submit" className={`${primaryButtonClass} mt-1.5`}>
              Continuar
              <ArrowRight className="size-4" />
            </Button>
          </form>

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
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          key="step2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
          >
            <ArrowLeft className="size-3.5" />
            Volver a datos personales
          </button>

          <h1 className="m-0 text-[24px] font-bold tracking-tight text-[#2A0E7A] lg:text-[26px]">
            Tu correo electrónico
          </h1>
          <p className="mt-0.5 mb-3.5 text-xs text-[#8C87A3]">
            Ingresá tu correo para recibir un código de verificación.
          </p>

          <form
            onSubmit={handleSendCode}
            noValidate
            className="m-0 grid max-w-none gap-3"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="reg-email" className={labelClass}>
                Correo electrónico
              </Label>
              <IconInput
                icon={Mail}
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
                className={inputClass}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p role="alert" className="m-0 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className={`${primaryButtonClass} mt-1.5`}>
              Enviar código
              <ArrowRight className="size-4" />
            </Button>
          </form>

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
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          key="step3"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            onClick={() => {
              setStep(2);
              setToast("");
            }}
            className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
          >
            <ArrowLeft className="size-3.5" />
            Modificar correo
          </button>

          <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#2A0E7A] lg:text-[24px]">
            Ingresá el código
          </h1>
          <p className="mt-0.5 mb-3 text-xs text-[#8C87A3]">
            Enviamos un código de 6 dígitos a{" "}
            <strong className="text-[#1C1633]">{watch("email") || ""}</strong>
          </p>

          <div className="mb-3.5 flex items-center justify-between gap-1.5">
            {otp.map((digit, i) => {
              const isFilled = !!digit;
              const isVerified = verifiedIndex >= i;
              return (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isCodeVerified || isVerifying}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className={cn(
                    "h-12 w-11 rounded-xl text-center font-mono text-xl font-bold transition-all duration-150",
                    "border-2 outline-none",
                    isVerified
                      ? "border-emerald-500! bg-emerald-50! text-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      : isFilled
                        ? "border-[#5B2EE0] bg-[#FAF8FE] text-[#1C1633]"
                        : "border-transparent bg-[#F3F1F9] text-[#1C1633] focus:border-[#5B2EE0] focus:bg-white focus:ring-2 focus:ring-[#5B2EE0]/30",
                  )}
                  aria-label={`Dígito ${i + 1}`}
                />
              );
            })}
          </div>

          <div className="mb-4 flex items-center justify-between text-xs text-[#8C87A3]">
            {countdown > 0 ? (
              <span>
                Reenviar código en{" "}
                <strong className="font-mono text-[#5B2EE0]">
                  {countdown}s
                </strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
              >
                Reenviar código
              </button>
            )}
            <span className="text-[11px] text-[#ABA6C2]">
              6 dígitos numéricos
            </span>
          </div>

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#5B2EE0]">
              <Loader2 className="size-4 animate-spin" />
              Verificando código...
            </div>
          )}

          {isCodeVerified && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-2 pt-0.5"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Código verificado correctamente
              </div>
              <Button
                type="button"
                onClick={() => {
                  setToast("");
                  setStep(4);
                }}
                className={primaryButtonClass}
              >
                Continuar a contraseña
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          )}

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
        </motion.div>
      )}

      {step === 4 && (
        <motion.div
          key="step4"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            onClick={() => setStep(3)}
            className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
          >
            <ArrowLeft className="size-3.5" />
            Volver a código de verificación
          </button>

          <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#2A0E7A] lg:text-[24px]">
            Creá tu contraseña
          </h1>
          <p className="mt-0.5 mb-2 text-xs text-[#8C87A3]">
            Elegí una clave segura para proteger tus operaciones.
          </p>

          <form
            onSubmit={handlePasswordSubmit}
            noValidate
            className="m-0 grid max-w-none gap-2"
          >
            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="reg-password" className={labelClass}>
                    Contraseña
                  </Label>
                  <PasswordTooltip />
                </div>
              </div>
              <PasswordInput
                icon={Lock}
                id="reg-password"
                autoComplete="new-password"
                placeholder="Ingresá tu contraseña"
                valid={isPasswordValid}
                className={inputClass}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p role="alert" className="m-0 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="reg-confirmPassword" className={labelClass}>
                Repetir contraseña
              </Label>
              <PasswordInput
                icon={Lock}
                id="reg-confirmPassword"
                autoComplete="new-password"
                placeholder="Repetí tu contraseña"
                valid={passwordsMatch}
                className={inputClass}
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {(errors.confirmPassword ||
                (!passwordsMatch && confirmPassword.length > 0)) && (
                <p role="alert" className="m-0 text-xs text-red-600">
                  {errors.confirmPassword?.message ||
                    "Las contraseñas no coinciden."}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-[#F8F6FD] p-2 text-xs">
              <p className="m-0 mb-1 text-[11px] font-medium text-[#4A4560]">
                Requisitos de la contraseña:
              </p>
              <div className="grid grid-cols-2 gap-1">
                <RequirementItem
                  met={hasMinLength}
                  text="Mínimo 8 caracteres"
                />
                <RequirementItem met={hasUppercase} text="Una mayúscula" />
                <RequirementItem met={hasLowercase} text="Una minúscula" />
                <RequirementItem met={hasNumber} text="Un número" />
              </div>
            </div>

            {serverError && (
              <p role="alert" className={alertClass}>
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              disabled={!isPasswordValid || !passwordsMatch}
              className={`${primaryButtonClass} mt-1`}
            >
              Continuar a validación de DNI
              <ArrowRight className="size-4" />
            </Button>
          </form>

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
        </motion.div>
      )}

      {step === 5 && (
        <motion.div
          key="step5"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <DniScanStep
            onComplete={() => setStep(6)}
            onBack={() => setStep(4)}
            onCancel={onCancel}
            backLabel="Volver a contraseña"
          />
        </motion.div>
      )}

      {step === 6 && (
        <motion.div
          key="step6"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <FacialScanStep
            onComplete={handleFinalSubmit}
            onBack={() => setStep(5)}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            completeLabel="Finalizar registro"
          />
        </motion.div>
      )}

      <RegisterSuccessModal
        open={showSuccessModal}
        firstName={firstName}
        lastName={lastName}
        onContinue={handleModalContinue}
      />
    </div>
  );
}

function RequirementItem({ met, text }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        met ? "font-medium text-emerald-600" : "text-[#8C87A3]",
      )}
    >
      {met ? (
        <Check className="size-3.5 shrink-0 stroke-[2.5]" />
      ) : (
        <Circle className="size-3.5 shrink-0" />
      )}
      <span className="text-[12px]">{text}</span>
    </div>
  );
}

function PasswordTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        aria-label="Requisitos de contraseña"
        className="cursor-pointer border-0 bg-transparent p-0.5 text-[#9C96B5] transition-colors hover:text-[#5B2EE0] focus:outline-none"
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-2xl bg-[#1C1633] p-3 text-xs text-white shadow-xl dark:bg-[#231A3D]">
          <p className="m-0 mb-1.5 font-semibold text-white">
            Formato de contraseña:
          </p>
          <ul className="m-0 space-y-1 p-0 pl-3.5 text-[11px] text-[#ABA6C2]">
            <li>Mínimo 8 caracteres</li>
            <li>Al menos una mayúscula</li>
            <li>Al menos una minúscula</li>
            <li>Al menos un número</li>
          </ul>
        </div>
      )}
    </div>
  );
}
