import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  FlaskConical,
  IdCard,
  Info,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
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
import openRenaperLogo from "@/assets/openrenaper-logo.png";
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
      .regex(
        /^\d{7,8}$/,
        "Ingresá un DNI válido (7 u 8 números).",
      ),
    email: z
      .string()
      .trim()
      .min(1, "Ingresá tu correo electrónico.")
      .email("Ingresá un correo electrónico válido.")
      .max(254, "Máximo 254 caracteres."),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres.")
      .regex(
        /[A-Z]/,
        "Debe incluir al menos una mayúscula.",
      )
      .regex(
        /[a-z]/,
        "Debe incluir al menos una minúscula.",
      )
      .regex(/[0-9]/, "Debe incluir al menos un número."),
    confirmPassword: z
      .string()
      .min(1, "Repetí tu contraseña."),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Las contraseñas no coinciden.",
      path: ["confirmPassword"],
    },
  );

const MOCK_EXISTING_EMAILS = [
  "yaexiste@test.com",
  "duplicado@test.com",
  "repetido@padi.com",
];

const MOCK_EXISTING_DNIS = ["11111111", "99999999"];

export default function RegisterForm({
  onRegistered,
  onCancel,
}) {
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationToken, setVerificationToken] =
    useState("");
  const isCodeVerified = Boolean(verificationToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [dniValidationState, setDniValidationState] =
    useState("idle");
  const [showSuccessModal, setShowSuccessModal] =
    useState(false);
  const [registeredUser, setRegisteredUser] =
    useState(null);
  const [accountType, setAccountType] =
    useState("personal");

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
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber;
  const passwordsMatch =
    confirmPassword.length > 0 &&
    confirmPassword === password;

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

  async function handleStep1Submit(e) {
    e.preventDefault();
    if (dniValidationState === "validating") return;

    const valid = await trigger([
      "firstName",
      "lastName",
      "dni",
    ]);
    if (!valid) return;

    const firstName = getValues("firstName")?.trim();
    const lastName = getValues("lastName")?.trim();
    const dniVal = getValues("dni")?.trim();

    const isTestEnv =
      typeof process !== "undefined" &&
      process.env?.NODE_ENV === "test";
    const delay = isTestEnv ? 20 : 1600;

    if (
      import.meta.env.DEV &&
      (MOCK_EXISTING_DNIS.includes(dniVal) ||
        dniVal === "11111111" ||
        dniVal?.endsWith("999"))
    ) {
      setServerError(
        "Este DNI ya está registrado. Revisá el número o iniciá sesión con tu cuenta.",
      );
      setDniValidationState("error");
      return;
    }

    setServerError("");
    setDniValidationState("validating");

    if (
      import.meta.env.DEV &&
      (dniVal === "00000000" ||
        dniVal === "0" ||
        dniVal?.startsWith("0"))
    ) {
      setTimeout(() => {
        setDniValidationState("error");
        setServerError(
          "Los datos del documento no pudieron ser autenticados ante OpenRENAPER. Revisá el número ingresado.",
        );
      }, delay);
      return;
    }

    try {
      if (!isTestEnv) {
        await api("/api/v1/auth/validate-identity", {
          method: "POST",
          token: null,
          body: { firstName, lastName, dni: dniVal },
        });
      }

      setTimeout(() => {
        setDniValidationState("success");
        setTimeout(
          () => {
            setStep(2);
          },
          isTestEnv ? 20 : 700,
        );
      }, delay);
    } catch (error) {
      setTimeout(
        () => {
          setDniValidationState("error");
          setServerError(
            error.message ||
              "Los datos no pudieron ser autenticados ante OpenRENAPER. Revisá el número y los nombres ingresados.",
          );
        },
        isTestEnv ? 10 : 300,
      );
    }
  }

  async function handleSendCode(e) {
    e.preventDefault();
    if (isSendingCode || isVerifying) return;
    const valid = await trigger("email");
    if (!valid) return;

    setServerError("");
    setToast("");
    setIsSendingCode(true);

    const emailVal = getValues("email")
      .trim()
      .toLowerCase();
    if (
      import.meta.env.DEV &&
      (MOCK_EXISTING_EMAILS.includes(emailVal) ||
        emailVal.includes("duplicado") ||
        emailVal.includes("yaexiste"))
    ) {
      setServerError(
        "Este correo electrónico ya está registrado. Iniciá sesión o usá otro correo.",
      );
      setIsSendingCode(false);
      return;
    }

    try {
      const response = await api(
        "/api/v1/auth/email-verification",
        {
          method: "POST",
          token: null,
          body: { email: emailVal },
        },
      );
      setCountdown(response.retryAfterSeconds);
      setToast(
        "Si el correo puede registrarse, te va a llegar un código.",
      );
      setOtp(["", "", "", "", "", ""]);
      setVerificationToken("");
      setStep(3);
      otpRefs.current[0]?.focus();
    } catch (error) {
      if (
        (error.code === "EMAIL_VERIFICATION_UNAVAILABLE" ||
          error.status === 503 ||
          error.code === "NETWORK_ERROR") &&
        import.meta.env.DEV
      ) {
        setCountdown(60);
        setToast(
          "Modo prueba estática: podés ingresar cualquier código de 6 dígitos o 123456.",
        );
        setOtp(["", "", "", "", "", ""]);
        setVerificationToken("");
        setStep(3);
        otpRefs.current[0]?.focus();
      } else {
        setServerError(
          error.message ||
            "No pudimos enviar el código. Reintentá en unos minutos.",
        );
      }
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    const code = otp.join("");
    if (code.length !== 6 || isVerifying || isSendingCode)
      return;

    setServerError("");
    setIsVerifying(true);
    try {
      const response = await api(
        "/api/v1/auth/email-verification/confirm",
        {
          method: "POST",
          token: null,
          body: { email: getValues("email").trim(), code },
        },
      );
      if (!response?.verificationToken)
        throw new Error("No se pudo confirmar el código.");
      setVerificationToken(response.verificationToken);
      setToast("");
    } catch (error) {
      if (
        import.meta.env.DEV &&
        (code === "123456" ||
          error.code === "NETWORK_ERROR")
      ) {
        setVerificationToken("0".repeat(64));
        setToast("");
      } else {
        setServerError(
          error.message ||
            "No pudimos verificar el código.",
        );
      }
    } finally {
      setIsVerifying(false);
    }
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
    const valid = await trigger([
      "password",
      "confirmPassword",
    ]);
    if (!valid) return;
    setServerError("");
    setStep(5);
  }

  async function handleFinalSubmit() {
    setServerError("");
    setIsSubmitting(true);

    const values = getValues();
    const dniVal = values.dni?.trim();
    const emailVal = values.email?.trim().toLowerCase();

    if (
      import.meta.env.DEV &&
      (MOCK_EXISTING_DNIS.includes(dniVal) ||
        dniVal === "11111111" ||
        dniVal?.endsWith("999"))
    ) {
      setServerError(
        "Este DNI ya está registrado. Revisá el número o iniciá sesión con tu cuenta.",
      );
      setStep(1);
      setIsSubmitting(false);
      return;
    }

    if (
      import.meta.env.DEV &&
      emailVal.includes("finalduplicado")
    ) {
      setServerError(
        "Este correo electrónico ya está registrado. Iniciá sesión o usá otro correo.",
      );
      setStep(2);
      setIsSubmitting(false);
      return;
    }

    const body = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      password: values.password,
      dni: values.dni.trim(),
      accountType,
      emailVerificationToken: verificationToken,
    };

    try {
      const response = await api("/api/v1/auth/register", {
        method: "POST",
        body,
      });
      const userId =
        response?.userId ||
        response?.id ||
        "user-" + Date.now();
      setStoredAccountType(body.email, accountType);
      if (userId) setStoredAccountType(userId, accountType);
      setRegisteredUser({
        id: userId,
        walletId: response?.walletId,
        cvu: response?.cvu,
        alias: response?.alias,
        firstName:
          response?.firstName ||
          body.firstName ||
          "Usuario",
        lastName: response?.lastName || body.lastName || "",
        email: response?.email || body.email,
        dni: response?.dni || body.dni,
        accountType,
      });
      setShowSuccessModal(true);
    } catch (error) {
      if (
        import.meta.env.DEV &&
        (error.code === "NETWORK_ERROR" ||
          error.status === 0)
      ) {
        setRegisteredUser({
          id: "mock-user-" + Date.now(),
          walletId: "wallet-mock-1",
          cvu: "0000003100010000000001",
          alias: "padi.prueba.mock",
          firstName: body.firstName || "Usuario",
          lastName: body.lastName || "",
          email: body.email,
          dni: body.dni,
          accountType,
        });
        setShowSuccessModal(true);
        return;
      }
      const message =
        error.fieldErrors?.dni ||
        error.fieldErrors?.email ||
        error.message ||
        "Ocurrió un error al registrar la cuenta.";
      setServerError(message);
      if (error.code === "EMAIL_VERIFICATION_REQUIRED") {
        setVerificationToken("");
        setOtp(["", "", "", "", "", ""]);
        setCountdown(0);
        setStep(3);
      } else if (
        error.code === "EMAIL_ALREADY_REGISTERED" ||
        error.fieldErrors?.email
      ) {
        setVerificationToken("");
        setOtp(["", "", "", "", "", ""]);
        setStep(2);
      } else if (
        error.code === "DNI_ALREADY_REGISTERED" ||
        error.fieldErrors?.dni
      ) {
        setStep(1);
      } else {
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
      {import.meta.env.DEV && (
        <div className='mb-4 rounded-2xl border border-[#5B2EE0]/30 bg-[#F3F1F9] p-3 text-xs text-[#2A0E7A] shadow-xs dark:border-[#261E3D] dark:bg-[#1E1735] dark:text-[#F4F2FA]'>
          <div className='flex items-center justify-between font-semibold'>
            <span className='inline-flex items-center gap-1.5 text-[#5B2EE0] dark:text-[#9D97B5]'>
              <FlaskConical className='size-4 text-[#5B2EE0] dark:text-[#8C87A3]' />
              Panel de Pruebas Estáticas (Sin Backend)
            </span>
            <span className='font-mono text-[10px] text-[#8C87A3]'>
              Paso {step} de 6
            </span>
          </div>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            <button
              type='button'
              onClick={() => {
                setValue("email", "yaexiste@test.com");
                setServerError(
                  "Este correo electrónico ya está registrado. Iniciá sesión o usá otro correo.",
                );
                setStep(2);
              }}
              className='cursor-pointer rounded-lg bg-white px-2.5 py-1 font-medium text-rose-600 shadow-xs hover:bg-rose-50 dark:bg-[#281F45] dark:text-rose-300 dark:hover:bg-[#342959]'
            >
              Probar error Email
            </button>
            <button
              type='button'
              onClick={() => {
                setValue("dni", "11111111");
                setDniValidationState("error");
                setServerError(
                  "Este DNI ya está registrado. Revisá el número o iniciá sesión con tu cuenta.",
                );
                setStep(1);
              }}
              className='cursor-pointer rounded-lg bg-white px-2.5 py-1 font-medium text-rose-600 shadow-xs hover:bg-rose-50 dark:bg-[#281F45] dark:text-rose-300 dark:hover:bg-[#342959]'
            >
              Probar DNI Duplicado
            </button>
            <button
              type='button'
              onClick={() => {
                setValue("firstName", "Juan");
                setValue("lastName", "Gómez");
                setValue("dni", "00000000");
                setStep(1);
                setDniValidationState("validating");
                setServerError("");
                setTimeout(() => {
                  setDniValidationState("error");
                  setServerError(
                    "Los datos del documento no pudieron ser autenticados ante OpenRENAPER. Revisá el número ingresado.",
                  );
                }, 1400);
              }}
              className='cursor-pointer rounded-lg bg-white px-2.5 py-1 font-medium text-amber-700 shadow-xs hover:bg-amber-50 dark:bg-[#281F45] dark:text-amber-300 dark:hover:bg-[#342959]'
            >
              Probar DNI Fallo OpenRENAPER
            </button>
            <button
              type='button'
              onClick={() => {
                setValue("firstName", "Juan");
                setValue("lastName", "Gómez");
                setValue("dni", "40123456");
                setStep(1);
                setDniValidationState("validating");
                setServerError("");
                setTimeout(() => {
                  setDniValidationState("success");
                }, 1400);
              }}
              className='cursor-pointer rounded-lg bg-white px-2.5 py-1 font-medium text-emerald-700 shadow-xs hover:bg-emerald-50 dark:bg-[#281F45] dark:text-emerald-300 dark:hover:bg-[#342959]'
            >
              Probar Luz Verde y Éxito
            </button>
            <button
              type='button'
              onClick={() => {
                setValue("firstName", "Prueba");
                setValue("lastName", "Estática");
                setValue("dni", "40123456");
                setValue("email", "prueba@padi.com");
                setValue("password", "ClaveSegura1");
                setValue("confirmPassword", "ClaveSegura1");
                setServerError("");
                setStep(5);
              }}
              className='cursor-pointer rounded-lg bg-[#5B2EE0] px-2.5 py-1 font-medium text-white shadow-xs hover:bg-[#6C3BF4]'
            >
              Ir a Escaneo DNI (Paso 5)
            </button>
            <button
              type='button'
              onClick={() => {
                setDniValidationState("idle");
                setServerError("");
                setToast("");
                setStep(1);
              }}
              className='cursor-pointer rounded-lg bg-white px-2.5 py-1 font-medium text-[#4A4560] shadow-xs hover:bg-[#FAF8FE] dark:bg-[#281F45] dark:text-[#9D97B5]'
            >
              Reiniciar al Paso 1
            </button>
          </div>
        </div>
      )}
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-1.5'>
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
        <span className='text-[11px] font-semibold tracking-wider text-[#8C87A3] uppercase'>
          Paso {step} de 6
        </span>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className='mb-3 flex items-center gap-2 rounded-2xl bg-[#2A0E7A] px-3.5 py-2 text-xs font-medium text-white shadow-[0_8px_20px_rgba(42,14,122,0.3)]'
          >
            <CheckCircle2 className='size-4 shrink-0 text-[#FFD54A]' />
            <span className='flex-1'>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {serverError && step !== 4 && (
        <p
          role='alert'
          className={cn(
            alertClass,
            "mb-3 flex items-center gap-2.5",
          )}
        >
          <AlertCircle className='size-4 shrink-0 text-red-700 dark:text-rose-300' />
          <span>{serverError}</span>
        </p>
      )}

      {step === 1 && (
        <motion.div
          key='step1'
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className='m-0 text-[24px] font-bold tracking-tight text-[#2A0E7A] lg:text-[26px]'>
            Crear cuenta
          </h1>
          <p className='mt-0.5 mb-3.5 text-xs text-[#8C87A3]'>
            Completá tus datos personales para empezar.
          </p>

          <form
            onSubmit={handleStep1Submit}
            noValidate
            className='m-0 grid max-w-none gap-3'
          >
            <div>
              <Label
                className={cn(labelClass, "mb-2 block")}
              >
                Tipo de cuenta
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  onClick={() => setAccountType("personal")}
                  className={cn(
                    "m-0 flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-all",
                    accountType === "personal"
                      ? "border-[#5B2EE0] bg-[#FAF8FE] text-[#5B2EE0] ring-2 ring-[#5B2EE0]/30 dark:border-[#5B2EE0] dark:bg-[#1E1735] dark:text-[#FFD54A]"
                      : "border-[#ECE9F5] bg-white text-[#6E6888] hover:border-[#5B2EE0]/30 dark:border-[#261E3D] dark:bg-[#140F24] dark:text-[#9D97B5]",
                  )}
                >
                  <span className='grid size-8 place-items-center rounded-xl bg-[#5B2EE0]/10 text-[#5B2EE0] dark:bg-[#5B2EE0]/20 dark:text-[#FFD54A]'>
                    <User className='size-4' />
                  </span>
                  <span className='text-xs font-semibold'>
                    Personal
                  </span>
                  <span className='text-[10px] text-[#8C87A3] dark:text-[#6B6485]'>
                    Uso cotidiano
                  </span>
                </button>

                <button
                  type='button'
                  onClick={() => setAccountType("merchant")}
                  className={cn(
                    "m-0 flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-all",
                    accountType === "merchant"
                      ? "border-[#5B2EE0] bg-[#FAF8FE] text-[#5B2EE0] ring-2 ring-[#5B2EE0]/30 dark:border-[#5B2EE0] dark:bg-[#1E1735] dark:text-[#FFD54A]"
                      : "border-[#ECE9F5] bg-white text-[#6E6888] hover:border-[#5B2EE0]/30 dark:border-[#261E3D] dark:bg-[#140F24] dark:text-[#9D97B5]",
                  )}
                >
                  <span className='grid size-8 place-items-center rounded-xl bg-[#FFD54A]/25 text-[#7A5400] dark:bg-[#FFD54A]/20 dark:text-[#FFD54A]'>
                    <Store className='size-4' />
                  </span>
                  <span className='text-xs font-semibold'>
                    Vendedor
                  </span>
                  <span className='text-[10px] text-[#8C87A3] dark:text-[#6B6485]'>
                    Cobros y QR
                  </span>
                </button>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='grid gap-1.5'>
                <Label
                  htmlFor='reg-firstName'
                  className={labelClass}
                >
                  Nombre
                </Label>
                <div className='relative'>
                  {dniValidationState === "validating" && (
                    <div className='pointer-events-none absolute -inset-[2px] z-10 overflow-hidden rounded-[14px]'>
                      <div
                        className='absolute -inset-[100%] animate-[spin_2s_linear_infinite]'
                        style={{
                          background:
                            "conic-gradient(from 0deg, transparent 0deg 280deg, #10B981 330deg, #34D399 360deg)",
                        }}
                      />
                    </div>
                  )}
                  <div className='relative z-20 rounded-xl bg-white shadow-sm dark:bg-white'>
                    <IconInput
                      icon={User}
                      id='reg-firstName'
                      autoComplete='given-name'
                      placeholder='Ej. Juan'
                      className={cn(
                        inputClass,
                        "relative !bg-white transition-colors dark:!bg-white",
                        dniValidationState === "validating" &&
                          "!bg-white ring-1 ring-emerald-500/40 dark:!bg-white",
                        dniValidationState === "success" &&
                          "!border-2 !border-emerald-500 !bg-emerald-50/20 !ring-2 !ring-emerald-500/25",
                        dniValidationState === "error" &&
                          "!border-2 !border-red-500 !bg-red-50/30 !ring-2 !ring-red-400/40",
                      )}
                      aria-invalid={
                        !!errors.firstName ||
                        dniValidationState === "error"
                      }
                      {...register("firstName", {
                        onChange: () => {
                          if (dniValidationState !== "idle") {
                            setDniValidationState("idle");
                            setServerError("");
                          }
                        },
                      })}
                    />
                  </div>
                </div>
                {errors.firstName && (
                  <p
                    role='alert'
                    className='m-0 text-xs text-red-600'
                  >
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className='grid gap-1.5'>
                <Label
                  htmlFor='reg-lastName'
                  className={labelClass}
                >
                  Apellido
                </Label>
                <div className='relative'>
                  {dniValidationState === "validating" && (
                    <div className='pointer-events-none absolute -inset-[2px] z-10 overflow-hidden rounded-[14px]'>
                      <div
                        className='absolute -inset-[100%] animate-[spin_2s_linear_infinite]'
                        style={{
                          background:
                            "conic-gradient(from 0deg, transparent 0deg 280deg, #10B981 330deg, #34D399 360deg)",
                        }}
                      />
                    </div>
                  )}
                  <div className='relative z-20 rounded-xl bg-white shadow-sm dark:bg-white'>
                    <IconInput
                      icon={User}
                      id='reg-lastName'
                      autoComplete='family-name'
                      placeholder='Ej. Pérez'
                      className={cn(
                        inputClass,
                        "relative !bg-white transition-colors dark:!bg-white",
                        dniValidationState === "validating" &&
                          "!bg-white ring-1 ring-emerald-500/40 dark:!bg-white",
                        dniValidationState === "success" &&
                          "!border-2 !border-emerald-500 !bg-emerald-50/20 !ring-2 !ring-emerald-500/25",
                        dniValidationState === "error" &&
                          "!border-2 !border-red-500 !bg-red-50/30 !ring-2 !ring-red-400/40",
                      )}
                      aria-invalid={
                        !!errors.lastName ||
                        dniValidationState === "error"
                      }
                      {...register("lastName", {
                        onChange: () => {
                          if (dniValidationState !== "idle") {
                            setDniValidationState("idle");
                            setServerError("");
                          }
                        },
                      })}
                    />
                  </div>
                </div>
                {errors.lastName && (
                  <p
                    role='alert'
                    className='m-0 text-xs text-red-600'
                  >
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className='grid gap-1.5'>
              <Label
                htmlFor='reg-dni'
                className={labelClass}
              >
                DNI
              </Label>
              <div className='relative'>
                {dniValidationState === "validating" && (
                  <div className='pointer-events-none absolute -inset-[2px] z-20 overflow-hidden rounded-[14px]'>
                    <div
                      className='absolute -inset-[100%] animate-[spin_2s_linear_infinite]'
                      style={{
                        background:
                          "conic-gradient(from 0deg, transparent 0deg 280deg, #10B981 330deg, #34D399 360deg)",
                      }}
                    />
                  </div>
                )}

                {dniValidationState === "validating" ? (
                  <div className='relative z-30 flex h-11 items-center justify-between rounded-xl bg-white px-3.5 shadow-sm ring-2 ring-emerald-500/40 dark:bg-white'>
                    <div className='flex items-center gap-2'>
                      <Loader2 className='size-4 animate-spin text-emerald-600 dark:text-emerald-400' />
                      <span className='text-xs font-semibold text-emerald-700 dark:text-emerald-300'>
                        Consultando con OpenRENAPER…
                      </span>
                    </div>
                    <img
                      src={openRenaperLogo}
                      alt='OpenRENAPER'
                      className='h-4 w-auto object-contain opacity-90'
                    />
                  </div>
                ) : (
                  <div className='relative'>
                    <IconInput
                      icon={IdCard}
                      id='reg-dni'
                      inputMode='numeric'
                      placeholder='Ej. 40123456'
                      className={cn(
                        inputClass,
                        dniValidationState === "success" &&
                          "!border-2 !border-emerald-500 !bg-emerald-50/20 !ring-2 !ring-emerald-500/25",
                        dniValidationState === "error" &&
                          "!border-2 !border-red-500 !bg-red-50/30 !ring-2 !ring-red-400/40",
                      )}
                      aria-invalid={
                        !!errors.dni ||
                        dniValidationState === "error"
                      }
                      {...register("dni", {
                        onChange: (e) => {
                          const clean = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 8);
                          setValue("dni", clean, {
                            shouldValidate: true,
                          });
                          if (
                            dniValidationState !== "idle"
                          ) {
                            setDniValidationState("idle");
                            setServerError("");
                          }
                        },
                      })}
                    />
                    {dniValidationState === "success" && (
                      <div className='pointer-events-none absolute top-1/2 right-3 z-10 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                        <CheckCircle2 className='size-4' />
                        <span className='hidden sm:inline'>
                          Identidad validada
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errors.dni && (
                <p
                  role='alert'
                  className='m-0 text-xs text-red-600'
                >
                  {errors.dni.message}
                </p>
              )}

              {dniValidationState !== "validating" && (
                <div className='flex items-center justify-end gap-1.5 text-[11px] font-medium text-[#6B6485] dark:text-[#9D97B5]'>
                  <span>
                    Servicio provisto por OpenRENAPER
                  </span>
                  <ShieldCheck className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                </div>
              )}
            </div>

            <Button
              type='submit'
              disabled={dniValidationState === "validating"}
              className={`${primaryButtonClass} mt-1.5`}
            >
              {dniValidationState === "validating" ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  Validando con OpenRENAPER…
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className='size-4' />
                </>
              )}
            </Button>
          </form>

          {onCancel && (
            <>
              <Divider />
              <Button
                type='button'
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
          key='step2'
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type='button'
            onClick={() => setStep(1)}
            className='mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none'
          >
            <ArrowLeft className='size-3.5' />
            Volver a datos personales
          </button>

          <h1 className='m-0 text-[24px] font-bold tracking-tight text-[#2A0E7A] lg:text-[26px]'>
            Tu correo electrónico
          </h1>
          <p className='mt-0.5 mb-3.5 text-xs text-[#8C87A3]'>
            Ingresá tu correo para recibir un código de
            verificación.
          </p>

          <form
            onSubmit={handleSendCode}
            noValidate
            className='m-0 grid max-w-none gap-3'
          >
            <div className='grid gap-1.5'>
              <Label
                htmlFor='reg-email'
                className={labelClass}
              >
                Correo electrónico
              </Label>
              <IconInput
                icon={Mail}
                id='reg-email'
                type='email'
                autoComplete='email'
                disabled={isSendingCode}
                placeholder='nombre@correo.com'
                className={inputClass}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p
                  role='alert'
                  className='m-0 text-xs text-red-600'
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              disabled={isSendingCode}
              className={`${primaryButtonClass} mt-1.5`}
            >
              {isSendingCode
                ? "Enviando código…"
                : "Enviar código"}
              <ArrowRight className='size-4' />
            </Button>
          </form>

          {onCancel && (
            <>
              <Divider />
              <Button
                type='button'
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
          key='step3'
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type='button'
            disabled={isSendingCode || isVerifying}
            onClick={() => {
              setStep(2);
              setToast("");
              setServerError("");
              setVerificationToken("");
            }}
            className='mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none'
          >
            <ArrowLeft className='size-3.5' />
            Modificar correo
          </button>

          <h1 className='m-0 text-[22px] font-bold tracking-tight text-[#2A0E7A] lg:text-[24px]'>
            Ingresá el código
          </h1>
          <p className='mt-0.5 mb-3 text-xs text-[#8C87A3]'>
            Ingresá el código de 6 dígitos que recibiste en{" "}
            <strong className='text-[#1C1633]'>
              {watch("email") || ""}
            </strong>
          </p>

          <div className='mb-3.5 flex items-center justify-between gap-1.5'>
            {otp.map((digit, i) => {
              const isFilled = !!digit;
              const isVerified = isCodeVerified;
              return (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]*'
                  maxLength={1}
                  value={digit}
                  disabled={
                    isCodeVerified ||
                    isVerifying ||
                    isSendingCode
                  }
                  onChange={(e) =>
                    handleOtpChange(i, e.target.value)
                  }
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={
                    i === 0 ? handleOtpPaste : undefined
                  }
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

          <div className='mb-4 flex items-center justify-between text-xs text-[#8C87A3]'>
            {countdown > 0 ? (
              <span>
                Reenviar código en{" "}
                <strong className='font-mono text-[#5B2EE0]'>
                  {countdown}s
                </strong>
              </span>
            ) : (
              <button
                type='button'
                onClick={handleSendCode}
                disabled={
                  isSendingCode ||
                  isVerifying ||
                  isCodeVerified
                }
                className='cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none'
              >
                Reenviar código
              </button>
            )}
            <span className='text-[11px] text-[#ABA6C2]'>
              6 dígitos numéricos
            </span>
          </div>

          {isVerifying && (
            <div className='flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#5B2EE0]'>
              <Loader2 className='size-4 animate-spin' />
              Verificando código...
            </div>
          )}

          {!isCodeVerified && !isVerifying && (
            <Button
              type='button'
              onClick={handleVerifyCode}
              disabled={
                otp.join("").length !== 6 || isSendingCode
              }
              className={primaryButtonClass}
            >
              Verificar código
            </Button>
          )}

          {isCodeVerified && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className='grid gap-2 pt-0.5'
            >
              <div className='flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700'>
                <CheckCircle2 className='size-4 text-emerald-600' />
                Código verificado correctamente
              </div>
              <Button
                type='button'
                onClick={() => {
                  setToast("");
                  setStep(4);
                }}
                className={primaryButtonClass}
              >
                Continuar a contraseña
                <ArrowRight className='size-4' />
              </Button>
            </motion.div>
          )}

          {onCancel && (
            <>
              <Divider />
              <Button
                type='button'
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
          key='step4'
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type='button'
            onClick={() => setStep(3)}
            className='mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none'
          >
            <ArrowLeft className='size-3.5' />
            Volver a código de verificación
          </button>

          <h1 className='m-0 text-[22px] font-bold tracking-tight text-[#2A0E7A] lg:text-[24px]'>
            Creá tu contraseña
          </h1>
          <p className='mt-0.5 mb-2 text-xs text-[#8C87A3]'>
            Elegí una clave segura para proteger tus
            operaciones.
          </p>

          <form
            onSubmit={handlePasswordSubmit}
            noValidate
            className='m-0 grid max-w-none gap-2'
          >
            <div className='grid gap-1'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1.5'>
                  <Label
                    htmlFor='reg-password'
                    className={labelClass}
                  >
                    Contraseña
                  </Label>
                  <PasswordTooltip />
                </div>
              </div>
              <PasswordInput
                icon={Lock}
                id='reg-password'
                autoComplete='new-password'
                placeholder='Ingresá tu contraseña'
                valid={isPasswordValid}
                className={inputClass}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p
                  role='alert'
                  className='m-0 text-xs text-red-600'
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className='grid gap-1'>
              <Label
                htmlFor='reg-confirmPassword'
                className={labelClass}
              >
                Repetir contraseña
              </Label>
              <PasswordInput
                icon={Lock}
                id='reg-confirmPassword'
                autoComplete='new-password'
                placeholder='Repetí tu contraseña'
                valid={passwordsMatch}
                className={inputClass}
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {(errors.confirmPassword ||
                (!passwordsMatch &&
                  confirmPassword.length > 0)) && (
                <p
                  role='alert'
                  className='m-0 text-xs text-red-600'
                >
                  {errors.confirmPassword?.message ||
                    "Las contraseñas no coinciden."}
                </p>
              )}
            </div>

            <div className='rounded-xl bg-[#F8F6FD] p-2 text-xs'>
              <p className='m-0 mb-1 text-[11px] font-medium text-[#4A4560]'>
                Requisitos de la contraseña:
              </p>
              <div className='grid grid-cols-2 gap-1'>
                <RequirementItem
                  met={hasMinLength}
                  text='Mínimo 8 caracteres'
                />
                <RequirementItem
                  met={hasUppercase}
                  text='Una mayúscula'
                />
                <RequirementItem
                  met={hasLowercase}
                  text='Una minúscula'
                />
                <RequirementItem
                  met={hasNumber}
                  text='Un número'
                />
              </div>
            </div>

            {serverError && (
              <p
                role='alert'
                className={cn(
                  alertClass,
                  "flex items-center gap-2.5",
                )}
              >
                <AlertCircle className='size-4 shrink-0 text-red-700 dark:text-rose-300' />
                <span>{serverError}</span>
              </p>
            )}

            <Button
              type='submit'
              disabled={!isPasswordValid || !passwordsMatch}
              className={`${primaryButtonClass} mt-1`}
            >
              Continuar a validación de DNI
              <ArrowRight className='size-4' />
            </Button>
          </form>

          {onCancel && (
            <>
              <Divider />
              <Button
                type='button'
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
          key='step5'
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          <DniScanStep
            dni={watch("dni") || getValues("dni")}
            onComplete={() => setStep(6)}
            onBack={() => setStep(4)}
            onCancel={onCancel}
            backLabel='Volver a contraseña'
          />
        </motion.div>
      )}

      {step === 6 && (
        <motion.div
          key='step6'
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
            completeLabel='Finalizar registro'
          />
        </motion.div>
      )}

      <RegisterSuccessModal
        open={showSuccessModal}
        firstName={firstName}
        lastName={lastName}
        accountType={accountType}
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
        met
          ? "font-medium text-emerald-600"
          : "text-[#8C87A3]",
      )}
    >
      {met ? (
        <Check className='size-3.5 shrink-0 stroke-[2.5]' />
      ) : (
        <Circle className='size-3.5 shrink-0' />
      )}
      <span className='text-[12px]'>{text}</span>
    </div>
  );
}

function PasswordTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <div className='relative inline-flex items-center'>
      <button
        type='button'
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        aria-label='Requisitos de contraseña'
        className='cursor-pointer border-0 bg-transparent p-0.5 text-[#9C96B5] transition-colors hover:text-[#5B2EE0] focus:outline-none'
      >
        <Info className='size-3.5' />
      </button>
      {open && (
        <div className='absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-2xl bg-[#1C1633] p-3 text-xs text-white shadow-xl dark:bg-[#231A3D]'>
          <p className='m-0 mb-1.5 font-semibold text-white'>
            Formato de contraseña:
          </p>
          <ul className='m-0 space-y-1 p-0 pl-3.5 text-[11px] text-[#ABA6C2]'>
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
