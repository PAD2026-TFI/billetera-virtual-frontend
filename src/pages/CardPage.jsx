import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
} from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import Field from '@/components/forms/Field';
import { Input } from '@/components/ui/input';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  fieldInputClass,
  primaryActionClass,
  secondaryActionClass,
  sectionTitleClass,
} from '@/components/forms/formStyles';
import { formatDate } from '@/lib/formatters';
import { formatCardNumber } from '@/lib/cards';
import { api } from '@/services/api';
import { mockTiming, wait } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

const provinces = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

const provinceCenters = {
  Tucumán: [-26.8241, -65.2226],
  'Buenos Aires': [-34.9214, -57.9545],
  'Ciudad Autónoma de Buenos Aires': [-34.6037, -58.3816],
  Córdoba: [-31.4201, -64.1888],
  'Santa Fe': [-31.6333, -60.7],
  Mendoza: [-32.8895, -68.8458],
};

const requestSteps = [
  { id: 'requested', label: 'Solicitada' },
  { id: 'production', label: 'En producción' },
  { id: 'shipped', label: 'En camino' },
  { id: 'delivered', label: 'Entregada' },
];

const physicalCardFeatures = [
  {
    icon: Package,
    iconBg:
      'bg-[#4C1DB8]/10 text-[#4C1DB8] dark:bg-[#5B2EE0]/20 dark:text-[#C4B2FF]',
    title: 'Entrega en 3 a 5 días',
    description: 'Directo a tu domicilio por correo postal.',
  },
  {
    icon: ShieldCheck,
    iconBg:
      'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    title: 'Sin costo de emisión',
    description: 'Tampoco pagás comisiones ni mantenimiento.',
  },
  {
    icon: Globe,
    iconBg:
      'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
    title: 'Aceptación global',
    description: 'Comprá en comercios físicos de todo el mundo.',
  },
  {
    icon: Zap,
    iconBg:
      'bg-[#FFD54A]/25 text-[#7A5400] dark:bg-[#FFD54A]/15 dark:text-[#FFD54A]',
    title: 'Contactless instantáneo',
    description: 'Pagá acercando el plástico a cualquier terminal.',
  },
];

const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'los', 'y']);
const titleCase = value =>
  value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && lowercaseWords.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');

const addressSchema = z.object({
  street: z.string().trim().min(3, 'Ingresá la calle.').max(80, 'Máximo 80 caracteres.'),
  number: z.string().trim().regex(/^\d{1,5}$/, 'Ingresá solo la altura, en números.'),
  unit: z.string().trim().max(10, 'Máximo 10 caracteres.').optional(),
  city: z.string().trim().min(2, 'Ingresá la localidad.').max(60, 'Máximo 60 caracteres.'),
  province: z.string().min(1, 'Elegí una provincia.'),
  postalCode: z
    .string()
    .trim()
    .regex(/^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/, 'Usá 4 números o el formato T4107ABC.'),
});

async function geolocate(address) {
  await wait(mockTiming.network);
  const [lat, lng] = provinceCenters[address.province] ?? [-34.6037, -58.3816];
  const jitter = (Number(address.number) % 97) / 10000;
  return {
    ...address,
    street: titleCase(address.street),
    city: titleCase(address.city),
    postalCode: address.postalCode.toUpperCase(),
    coordinates: { lat: +(lat + jitter).toFixed(5), lng: +(lng - jitter).toFixed(5) },
  };
}

const formatAddress = address =>
  `${address.street} ${address.number}${address.unit ? `, ${address.unit}` : ''}, ${address.city}, ${address.province} (${address.postalCode})`;

function CardFace({ cardId, holderName, lastDigits, expiry }) {
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const showDetails = details !== null;
  const fullCardNumber = showDetails ? formatCardNumber(details.cardNumber) : '';

  async function toggleDetails() {
    if (showDetails) {
      setDetails(null);
      setCopied(false);
      return;
    }
    setDetailsError('');
    setLoading(true);
    try {
      setDetails(await api(`/api/v1/me/cards/${cardId}/virtual-credentials`, { method: 'POST' }));
    } catch (error) {
      setDetailsError(error.message || 'No pudimos obtener los datos de tu tarjeta.');
    } finally {
      setLoading(false);
    }
  }

  function copyNumber() {
    navigator.clipboard?.writeText(fullCardNumber.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-3">
      <div
        role="img"
        aria-label={`Tarjeta virtual terminada en ${lastDigits}, vence ${expiry}`}
        className="relative aspect-[1.586] w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-[#251057] via-[#170A38] to-[#0D0620] p-6 text-white shadow-[0_24px_46px_-20px_rgba(37,16,87,0.85)] transition-all duration-300 dark:shadow-[0_0_34px_rgba(91,46,224,0.28)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 size-60 rounded-full bg-[radial-gradient(circle,rgba(255,213,74,0.24)_0%,transparent_68%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 size-60 rounded-full bg-[radial-gradient(circle,rgba(122,77,255,0.42)_0%,transparent_70%)]"
        />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-end text-xl leading-none font-bold tracking-[-0.05em]">
                padi
                <span className="mb-[0.1em] ml-[0.08em] size-[0.24em] rounded-full bg-[#FFD54A]" />
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#FFD54A] uppercase">
                Prepaga
              </span>
            </div>
            <Wifi className="size-5 rotate-90 text-white/75" aria-hidden="true" />
          </div>

          <div className="flex items-center justify-between">
            <span
              aria-hidden="true"
              className="relative grid h-8 w-11 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-[#FFE885] via-[#FFD54A] to-[#C89214] shadow-inner"
            >
              <span className="h-4 w-6 rounded-[2px] border border-[#7A5400]/35" />
            </span>

            {showDetails && (
              <span className="rounded-full bg-[#FFD54A]/20 px-3 py-1 font-mono text-xs font-bold text-[#FFD54A]">
                CVV: {details.cvv}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="m-0 font-mono text-base font-semibold tracking-[0.16em] text-white sm:text-lg">
                {showDetails ? fullCardNumber : `•••• •••• •••• ${lastDigits}`}
              </p>
              {showDetails && (
                <button
                  type="button"
                  onClick={copyNumber}
                  aria-label={copied ? 'Número copiado' : 'Copiar número'}
                  className={`m-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                    copied
                      ? 'bg-emerald-400 text-[#090613] shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 stroke-[2.5]" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-white/12 pt-2.5 text-xs text-white/85">
              <span className="truncate font-medium tracking-wide">{holderName}</span>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-white/80">VTO {expiry}</span>
                <span aria-hidden="true" className="inline-flex items-center">
                  <span className="size-4 rounded-full bg-[#EB001B]/85" />
                  <span className="-ml-1.5 size-4 rounded-full bg-[#F79E1B]/85 mix-blend-screen" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleDetails}
        disabled={loading || !cardId}
        className="m-0 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-0 bg-[#F3F1F9] px-4 text-xs font-semibold text-[#4C1DB8] transition-colors hover:bg-[#E9E5F6] sm:text-sm dark:bg-[#1E1735] dark:text-[#FFD54A] dark:hover:bg-[#281F45]"
      >
        {showDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        {loading ? 'Consultando datos…' : showDetails ? 'Ocultar datos de la tarjeta' : 'Mostrar datos de la tarjeta'}
      </button>
      {detailsError && <p role="alert" className="m-0 text-sm">{detailsError}</p>}
    </div>
  );
}

function RequestTracker({ request }) {
  const current = requestSteps.findIndex(step => step.id === request.status);
  return (
    <div className="flex h-full flex-1 flex-col justify-between gap-5 animate-page-enter">
      <div className="grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className={`${sectionTitleClass} m-0 tracking-tight`}>
            Tu tarjeta física está en camino
          </h2>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
            En curso
          </span>
        </div>

        <ol aria-label="Estado de la solicitud" className="m-0 grid list-none gap-0 p-0">
          {requestSteps.map((step, index) => {
            const done = index <= current;
            const isCurrent = index === current;
            return (
              <li
                key={step.id}
                aria-current={isCurrent ? 'step' : undefined}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                {index < requestSteps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-9 left-[17px] h-[calc(100%-36px)] w-0.5 ${
                      index < current
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-[#E2DCF5] dark:bg-[#281F45]'
                    }`}
                  />
                )}
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold ${
                    done
                      ? 'bg-[#4C1DB8] text-white shadow-[0_6px_14px_-4px_rgba(76,29,184,0.65)] dark:bg-[#FFD54A] dark:text-[#1C1633]'
                      : 'bg-[#F3F1F9] text-[#8C87A3] dark:bg-[#19122C] dark:text-[#6B6485]'
                  }`}
                >
                  {done ? <Check className="size-4 stroke-[2.5]" aria-hidden="true" /> : index + 1}
                </span>
                <div className="pt-1">
                  <p
                    className={`m-0 text-sm font-bold ${
                      done
                        ? 'text-[#1C1633] dark:text-[#F4F2FA]'
                        : 'text-[#8C87A3] dark:text-[#6B6485]'
                    }`}
                  >
                    {step.label}
                  </p>
                  {index === 0 && (
                    <p className="m-0 mt-0.5 font-mono text-xs text-[#6E6888] dark:text-[#9D97B5]">
                      {formatDate(request.createdAt)}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-3">
        <div className="flex gap-3.5 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#FFD54A]">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
              Se entrega en
            </p>
            <p className="m-0 mt-0.5 text-sm font-semibold text-[#1C1633] dark:text-[#F4F2FA]">
              {formatAddress(request.address)}
            </p>
          </div>
        </div>
        <p className="m-0 font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">
          Solicitud {request.id}
        </p>
      </div>
    </div>
  );
}

function PhysicalCardHero({ onStart }) {
  return (
    <div className="flex h-full flex-1 flex-col justify-between gap-5">
      <div className="flex flex-col gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD54A]/25 px-3 py-1 text-xs font-bold text-[#7A5400] dark:bg-[#FFD54A]/15 dark:text-[#FFD54A]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Envío 100% gratuito
          </span>
          <h2 className={`${sectionTitleClass} m-0 mt-2.5 tracking-tight`}>
            Pedí tu tarjeta física
          </h2>
          <p className="mt-1 mb-0 text-sm text-[#6E6888] dark:text-[#9D97B5]">
            Llevá tu saldo padi. a cualquier comercio del mundo con tecnología contactless.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {physicalCardFeatures.map(feat => (
            <div
              key={feat.title}
              className="flex flex-col justify-start gap-2 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]"
            >
              <div className="flex items-center gap-2.5">
                <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${feat.iconBg}`}>
                  <feat.icon className="size-4 stroke-[2.2]" aria-hidden="true" />
                </div>
                <p className="m-0 text-[13px] leading-tight font-bold text-[#1C1633] sm:text-sm dark:text-[#F4F2FA]">
                  {feat.title}
                </p>
              </div>
              <p className="m-0 text-xs leading-relaxed text-[#6E6888] dark:text-[#9D97B5]">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}
      >
        <span>Pedir tarjeta física</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function AddressForm({ onValidated, onCancel }) {
  const [checking, setChecking] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(addressSchema), mode: 'onTouched' });

  async function submit(values) {
    setChecking(true);
    onValidated(await geolocate(values));
    setChecking(false);
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="m-0 flex h-full flex-1 flex-col justify-between gap-4 animate-page-enter"
    >
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold tracking-wider text-[#4C1DB8] uppercase dark:text-[#FFD54A]">
              Paso 1 de 2 · Domicilio postal
            </span>
            <h2 className={`${sectionTitleClass} m-0 mt-0.5`}>Dirección de entrega</h2>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="m-0 rounded-full bg-[#F3F1F9] px-3.5 py-1.5 text-xs font-semibold text-[#4A4560] hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#9D97B5]"
            >
              Cancelar
            </button>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
          <Field id="street" label="Calle" error={errors.street}>
            <Input
              id="street"
              autoComplete="address-line1"
              className={fieldInputClass}
              aria-invalid={!!errors.street}
              {...register('street')}
            />
          </Field>
          <Field id="number" label="Altura" error={errors.number}>
            <Input
              id="number"
              inputMode="numeric"
              className={`${fieldInputClass} font-mono`}
              aria-invalid={!!errors.number}
              {...register('number')}
            />
          </Field>
        </div>

        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
          <Field id="unit" label="Piso / depto" error={errors.unit}>
            <Input
              id="unit"
              placeholder="Opcional"
              className={fieldInputClass}
              aria-invalid={!!errors.unit}
              {...register('unit')}
            />
          </Field>
          <Field id="city" label="Localidad" error={errors.city}>
            <Input
              id="city"
              autoComplete="address-level2"
              className={fieldInputClass}
              aria-invalid={!!errors.city}
              {...register('city')}
            />
          </Field>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
          <Field id="province" label="Provincia" error={errors.province}>
            <CustomSelect
              id="province"
              defaultValue=""
              aria-invalid={!!errors.province}
              {...register('province')}
            >
              <option value="" disabled>
                Elegí una
              </option>
              {provinces.map(province => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </CustomSelect>
          </Field>
          <Field id="postalCode" label="Código postal" error={errors.postalCode}>
            <Input
              id="postalCode"
              autoComplete="postal-code"
              className={`${fieldInputClass} font-mono uppercase`}
              aria-invalid={!!errors.postalCode}
              {...register('postalCode')}
            />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={checking}
        className={`${primaryActionClass} mt-4 inline-flex items-center justify-center gap-2`}
      >
        {checking && <Loader2 className="size-4 animate-spin" />}
        {checking ? 'Revisando la dirección…' : 'Revisar dirección'}
      </button>
    </form>
  );
}

function CardContent({ summary }) {
  const requestPhysicalCard = useWalletStore(state => state.requestPhysicalCard);
  const [isRequesting, setIsRequesting] = useState(false);
  const [validated, setValidated] = useState(null);
  const [sending, setSending] = useState(false);
  const fullName = `${summary.holder.firstName} ${summary.holder.lastName}`;

  async function confirm() {
    setSending(true);
    await requestPhysicalCard(validated);
    setSending(false);
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:items-stretch">
      <section
        aria-labelledby="virtual-card-title"
        className={`m-0 flex h-full flex-col justify-between gap-4 border-0 ${panelClass}`}
      >
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="virtual-card-title" className={`${sectionTitleClass} m-0 tracking-tight`}>
              Tarjeta virtual
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-300">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Habilitada
            </span>
          </div>

          <CardFace
            key={summary.card.virtualCardId}
            cardId={summary.card.virtualCardId}
            holderName={fullName}
            lastDigits={summary.card.lastDigits}
            expiry={summary.card.expiry}
          />
        </div>

        <dl className="m-0 grid grid-cols-2 gap-2.5">
          {[
            [
              'Estado',
              <span key="status" className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Activa
              </span>,
            ],
            ['Vence', <span key="expiry" className="font-mono">{summary.card.expiry}</span>],
            ['Titular', fullName],
            [
              'Terminada en',
              <span key="digits" className="font-mono">
                {summary.card.lastDigits}
              </span>,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl bg-[#F8F7FD] p-3 dark:bg-[#1E1735]"
            >
              <dt className="text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
                {label}
              </dt>
              <dd className="m-0 mt-0.5 truncate text-sm font-bold text-[#1C1633] dark:text-[#F4F2FA]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={`flex h-full flex-col justify-between ${panelClass}`}>
        {summary.cardRequest ? (
          <RequestTracker request={summary.cardRequest} />
        ) : validated ? (
          <div className="flex h-full flex-1 flex-col justify-between gap-5 animate-page-enter">
            <div className="grid gap-5">
              <div>
                <span className="text-xs font-semibold tracking-wider text-[#4C1DB8] uppercase dark:text-[#FFD54A]">
                  Paso 2 de 2 · Verificación geográfica
                </span>
                <h2 className={`${sectionTitleClass} m-0 mt-0.5`}>
                  Confirmá la dirección de entrega
                </h2>
              </div>

              <div className="flex gap-3.5 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#EDE7FC] text-[#4C1DB8] dark:bg-[#261D42] dark:text-[#FFD54A]">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-sm font-bold text-[#1C1633] dark:text-[#F4F2FA]">
                    {formatAddress(validated)}
                  </p>
                  <p className="mt-1 mb-0 font-mono text-xs text-[#6E6888] dark:text-[#9D97B5]">
                    {validated.coordinates.lat}, {validated.coordinates.lng}
                  </p>
                </div>
              </div>

              <p className="m-0 text-sm text-[#6E6888] dark:text-[#9D97B5]">
                Encontramos la dirección en el mapa. Si algo no coincide, corregilo antes de pedir la tarjeta.
              </p>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setValidated(null)}
                disabled={sending}
                className={secondaryActionClass}
              >
                Corregir
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={sending}
                className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}
              >
                {sending && <Loader2 className="size-4 animate-spin" />}
                {sending ? 'Pidiendo…' : 'Pedir tarjeta'}
              </button>
            </div>
          </div>
        ) : isRequesting ? (
          <AddressForm onValidated={setValidated} onCancel={() => setIsRequesting(false)} />
        ) : (
          <PhysicalCardHero onStart={() => setIsRequesting(true)} />
        )}
      </div>
    </div>
  );
}

export default function CardPage() {
  return (
    <AppLayout
      header={() => (
        <PageHeader
          title="Mi tarjeta"
          subtitle="Usá tu tarjeta virtual o pedí la física."
        />
      )}
    >
      {summary => <CardContent summary={summary} />}
    </AppLayout>
  );
}
