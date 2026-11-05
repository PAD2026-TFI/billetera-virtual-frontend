import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from 'cn';
import { IconInput, PasswordInput } from './IconInput.jsx';
import { Divider } from './LoginForm.jsx';
import DniScanStep from './DniScanStep.jsx';
import FacialScanStep from './FacialScanStep.jsx';
import RegisterSuccessModal from './RegisterSuccessModal.jsx';
import {
  alertClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './styles.js';

export default function RegisterForm({ onRegistered, onCancel }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifiedIndex, setVerifiedIndex] = useState(-1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [step1Error, setStep1Error] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (step !== 3 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(c => (c > 0 ? c - 1 : 0));
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
    const fullCode = otp.join('');
    if (fullCode.length === 6 && !isCodeVerified && !isVerifying) {
      setIsVerifying(true);
      setVerifiedIndex(-1);

      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          setVerifiedIndex(i);
        }, (i + 1) * 110);
      }

      setTimeout(() => {
        setIsVerifying(false);
        setIsCodeVerified(true);
      }, 6 * 110 + 200);
    }
  }, [otp, isCodeVerified, isVerifying]);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;

  function handleDniChange(e) {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 8);
    setDni(clean);
    if (step1Error) setStep1Error('');
  }

  function handleStep1Submit(e) {
    e.preventDefault();
    if (!firstName.trim()) {
      setStep1Error('Ingresá tu nombre.');
      return;
    }
    if (!lastName.trim()) {
      setStep1Error('Ingresá tu apellido.');
      return;
    }
    if (dni.length < 7 || dni.length > 8) {
      setStep1Error('Ingresá un DNI válido (7 u 8 números).');
      return;
    }
    setStep1Error('');
    setStep(2);
  }

  function handleSendCode(e) {
    e?.preventDefault();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!validEmail) {
      setEmailError('Ingresá un correo electrónico válido.');
      return;
    }
    setEmailError('');
    setCountdown(60);
    setToast('¡Código enviado! Revisá tu casilla de correo.');
    setOtp(['', '', '', '', '', '']);
    setVerifiedIndex(-1);
    setIsCodeVerified(false);
    setStep(3);
  }

  function handleResendCode() {
    setCountdown(60);
    setToast('¡Código reenviado! Revisá tu casilla de correo.');
    setOtp(['', '', '', '', '', '']);
    setVerifiedIndex(-1);
    setIsCodeVerified(false);
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 100);
  }

  function handleOtpChange(index, value) {
    const char = value.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = char;
    setOtp(nextOtp);

    if (char && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasted[i] || '';
    }
    setOtp(nextOtp);
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!isPasswordValid || !passwordsMatch) return;
    setStep(5);
  }

  async function handleFinalSubmit() {
    setServerError('');
    setIsSubmitting(true);

    const body = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      dni,
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const mockUser = {
        id: 'user-' + Date.now(),
        firstName: body.firstName || 'Usuario',
        lastName: body.lastName || '',
        email: body.email,
        dni: body.dni,
      };
      setRegisteredUser(mockUser);
      setShowSuccessModal(true);
    } catch {
      setServerError('Ocurrió un error inesperado. Por favor reintentá.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleModalContinue() {
    setShowSuccessModal(false);
    onRegistered?.(registeredUser, { email, password });
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step
                  ? 'w-7 bg-[#4C1DB8]'
                  : i < step
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-[#ECE9F5]'
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

          <form onSubmit={handleStep1Submit} noValidate className="m-0 grid max-w-none gap-3">
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
                  value={firstName}
                  onChange={e => {
                    setFirstName(e.target.value);
                    if (step1Error) setStep1Error('');
                  }}
                  className={inputClass}
                />
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
                  value={lastName}
                  onChange={e => {
                    setLastName(e.target.value);
                    if (step1Error) setStep1Error('');
                  }}
                  className={inputClass}
                />
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
                value={dni}
                onChange={handleDniChange}
                className={inputClass}
              />
            </div>

            {step1Error && (
              <p role="alert" className="m-0 text-xs text-red-600">
                {step1Error}
              </p>
            )}

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
            onClick={() => {
              setStep(1);
              setToast('');
            }}
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

          <form onSubmit={handleSendCode} noValidate className="m-0 grid max-w-none gap-3">
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
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                className={inputClass}
              />
              {emailError && (
                <p role="alert" className="m-0 text-xs text-red-600">
                  {emailError}
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
              setToast('');
            }}
            className="mb-1.5 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] transition-colors hover:text-[#3D1499] focus:outline-none"
          >
            <ArrowLeft className="size-3.5" />
            Modificar correo
          </button>

          <h1 className="m-0 text-[24px] font-bold tracking-tight text-[#2A0E7A] lg:text-[26px]">
            Ingresá el código
          </h1>
          <p className="mt-0.5 mb-3 text-xs text-[#8C87A3]">
            Te enviamos un código de 6 dígitos a{' '}
            <strong className="font-semibold text-[#1C1633]">{email}</strong>
          </p>

          <div className="grid gap-3.5">
            <div className="grid gap-1.5">
              <Label className={labelClass}>Código de verificación</Label>
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, idx) => {
                  const isHighlighted = idx <= verifiedIndex;
                  return (
                    <input
                      key={idx}
                      ref={el => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={cn(
                        'size-11 sm:size-12 rounded-xl border-2 text-center font-mono text-lg font-bold outline-none transition-all duration-200',
                        isHighlighted
                          ? 'scale-105 border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                          : digit
                            ? 'border-[#5B2EE0] bg-white text-[#1C1633] ring-1 ring-[#5B2EE0]/30'
                            : 'border-transparent bg-[#F3F1F9] text-[#1C1633] focus:border-[#5B2EE0] focus:bg-white focus:ring-2 focus:ring-[#5B2EE0]/30'
                      )}
                    />
                  );
                })}
              </div>
            </div>

            <div className="text-center pt-0.5">
              {countdown > 0 ? (
                <p className="m-0 text-xs text-[#8C87A3]">
                  Podés reenviar el código en{' '}
                  <span className="font-mono font-semibold text-[#4C1DB8]">
                    00:{countdown < 10 ? '0' : ''}
                    {countdown}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-[#5B2EE0] hover:text-[#3D1499] hover:underline"
                >
                  Reenviar código
                </button>
              )}
            </div>

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
                    setToast('');
                    setStep(4);
                  }}
                  className={primaryButtonClass}
                >
                  Continuar a contraseña
                  <ArrowRight className="size-4" />
                </Button>
              </motion.div>
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

          <form onSubmit={handlePasswordSubmit} noValidate className="m-0 grid max-w-none gap-2">
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
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (serverError) setServerError('');
                }}
                className={inputClass}
              />
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
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (serverError) setServerError('');
                }}
                className={inputClass}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p role="alert" className="m-0 text-xs text-red-600">
                  Las contraseñas no coinciden.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-[#F8F6FD] p-2 text-xs">
              <p className="m-0 mb-1 text-[11px] font-medium text-[#4A4560]">Requisitos de la contraseña:</p>
              <div className="grid grid-cols-2 gap-1">
                <RequirementItem met={hasMinLength} text="Mínimo 8 caracteres" />
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
        'flex items-center gap-1.5 transition-colors',
        met ? 'font-medium text-emerald-600' : 'text-[#8C87A3]'
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
        onClick={() => setOpen(o => !o)}
        aria-label="Requisitos de contraseña"
        className="cursor-pointer border-0 bg-transparent p-0.5 text-[#9C96B5] transition-colors hover:text-[#5B2EE0] focus:outline-none"
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-2xl bg-[#1C1633] p-3 text-xs text-white shadow-xl dark:bg-[#231A3D]">
          <p className="m-0 mb-1.5 font-semibold text-white">Formato de contraseña:</p>
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
