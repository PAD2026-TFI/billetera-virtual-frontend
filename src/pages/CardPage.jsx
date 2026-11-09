import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, Copy, CreditCard, Eye, EyeOff, Globe, Loader2, MapPin, Package, ShieldCheck, Sparkles, Wifi, Zap } from 'lucide-react';
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
import { mockTiming, wait } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

const provinces = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad Autónoma de Buenos Aires', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
  'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

const provinceCenters = {
  'Tucumán': [-26.8241, -65.2226],
  'Buenos Aires': [-34.9214, -57.9545],
  'Ciudad Autónoma de Buenos Aires': [-34.6037, -58.3816],
  'Córdoba': [-31.4201, -64.1888],
  'Santa Fe': [-31.6333, -60.7],
  'Mendoza': [-32.8895, -68.8458],
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
    iconBg: 'bg-[#E6DFFB] text-[#4C1DB8] dark:bg-[#281F45] dark:text-[#B9A6FF]',
    title: 'Entrega en 3 a 5 días',
    description: 'Directo a tu domicilio por correo postal.',
  },
  {
    icon: ShieldCheck,
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    title: 'Sin costo de emisión',
    description: 'Tampoco pagás comisiones ni mantenimiento.',
  },
  {
    icon: Globe,
    iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400',
    title: 'Aceptación global',
    description: 'Comprá en comercios físicos de todo el mundo.',
  },
  {
    icon: Zap,
    iconBg: 'bg-[#FFF0C2] text-[#8A6100] dark:bg-[#FFD54A]/20 dark:text-[#FFE664]',
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
    .map((word, index) => (index > 0 && lowercaseWords.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');

const addressSchema = z.object({
  street: z.string().trim().min(3, 'Ingresá la calle.').max(80, 'Máximo 80 caracteres.'),
  number: z.string().trim().regex(/^\d{1,5}$/, 'Ingresá solo la altura, en números.'),
  unit: z.string().trim().max(10, 'Máximo 10 caracteres.').optional(),
  city: z.string().trim().min(2, 'Ingresá la localidad.').max(60, 'Máximo 60 caracteres.'),
  province: z.string().min(1, 'Elegí una provincia.'),
  postalCode: z.string().trim().regex(/^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/, 'Usá 4 números o el formato T4107ABC.'),
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

function CardFace({ holderName, lastDigits, expiry, showDetails, onToggleDetails }) {
  const [copied, setCopied] = useState(false);
  const fullCardNumber = `4532 8912 3456 ${lastDigits}`;
  const cvv = '742';

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
        className="relative aspect-[1.586] w-full max-w-sm overflow-hidden rounded-[24px] bg-gradient-to-br from-[#7A4DFF] via-[#5B2EE0] to-[#3A1299] p-6 text-white shadow-[0_22px_40px_-20px_rgba(58,18,153,0.75)] dark:shadow-[0_0_35px_rgba(91,46,224,0.3)] transition-all duration-300"
      >
        <span aria-hidden="true" className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="inline-flex items-end text-xl leading-none font-bold tracking-[-0.05em]">
              padi
              <span className="mb-[0.1em] ml-[0.08em] size-[0.24em] rounded-full bg-[#FFD54A]" />
            </span>
            <Wifi className="size-5 rotate-90 text-white/80" aria-hidden="true" />
          </div>

          <div className="flex items-center justify-between">
            <div className="h-8 w-11 rounded-md bg-gradient-to-br from-[#FFE27A] to-[#E6B422]" />
            {showDetails && (
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-xs font-semibold">
                CVV: {cvv}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="m-0 font-mono text-lg tracking-[0.16em]">
                {showDetails ? fullCardNumber : `•••• •••• •••• ${lastDigits}`}
              </p>
              {showDetails && (
                <button
                  type="button"
                  onClick={copyNumber}
                  aria-label={copied ? 'Número copiado' : 'Copiar número'}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                    copied
                      ? 'bg-emerald-400 text-[#090613] shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                      : 'border border-white/25 bg-white/15 text-white hover:bg-white/25'
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
            <div className="mt-2 flex justify-between text-sm text-white/85">
              <span>{holderName}</span>
              <span className="font-mono">{expiry}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleDetails}
        className="inline-flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-full border border-[#ECE9F5] bg-[#F8F7FD] px-4 text-sm font-semibold text-[#4C1DB8] transition-colors hover:bg-[#F3F1F9] dark:border-[#261E3D] dark:bg-[#1E1735] dark:text-[#B9A6FF] dark:hover:bg-[#281F45]"
      >
        {showDetails ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        {showDetails ? 'Ocultar datos de la tarjeta' : 'Mostrar datos de la tarjeta'}
      </button>
    </div>
  );
}

function RequestTracker({ request }) {
  const current = requestSteps.findIndex(step => step.id === request.status);
  return (
    <div className="flex h-full flex-1 flex-col justify-between gap-5 animate-page-enter">
      <div className="grid gap-5">
        <h2 className={sectionTitleClass}>Tu tarjeta física está en camino</h2>
        <ol aria-label="Estado de la solicitud" className="m-0 grid list-none gap-0 p-0">
          {requestSteps.map((step, index) => {
            const done = index <= current;
            return (
              <li key={step.id} aria-current={index === current ? 'step' : undefined} className="relative flex gap-4 pb-6 last:pb-0">
                {index < requestSteps.length - 1 && (
                  <span aria-hidden="true" className={`absolute top-9 left-[17px] h-[calc(100%-36px)] w-0.5 ${index < current ? 'bg-[#4C1DB8]' : 'bg-[#E2DCF5] dark:bg-[#281F45]'}`} />
                )}
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ${done ? 'bg-[#4C1DB8] text-white dark:bg-[#5B2EE0]' : 'bg-[#F3F1F9] text-[#ABA6C2] dark:bg-[#1E1735] dark:text-[#6B6485]'}`}>
                  {done ? <Check className="size-4" aria-hidden="true" /> : <span className="font-mono text-sm">{index + 1}</span>}
                </span>
                <div className="pt-1.5">
                  <p className={`m-0 text-sm font-semibold ${done ? 'text-[#1C1633] dark:text-[#F4F2FA]' : 'text-[#8C87A3] dark:text-[#6B6485]'}`}>{step.label}</p>
                  {index === 0 && <p className="m-0 font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">{formatDate(request.createdAt)}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="grid gap-3">
        <div className="flex gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
          <MapPin className="mt-0.5 size-5 shrink-0 text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold">Se entrega en</p>
            <p className="m-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">{formatAddress(request.address)}</p>
          </div>
        </div>
        <p className="m-0 font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">Solicitud {request.id}</p>
      </div>
    </div>
  );
}

function PhysicalCardHero({ onStart }) {
  return (
    <div className="flex h-full flex-1 flex-col justify-between gap-5">
      <div className="flex flex-col gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0C2] px-3 py-1 text-xs font-bold text-[#8A6100] dark:bg-[#FFD54A]/20 dark:text-[#FFE664]">
            <Sparkles className="size-3.5" />
            Envío 100% gratuito
          </span>
          <h2 className={`mt-2.5 ${sectionTitleClass}`}>Pedí tu tarjeta física</h2>
          <p className="mt-1 mb-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">
            Llevá tu saldo padi a cualquier comercio del mundo con tecnología contactless.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {physicalCardFeatures.map(feat => (
            <div
              key={feat.title}
              className="flex flex-col justify-between rounded-2xl border border-[#ECE9F5] bg-[#F8F7FD] p-3 transition-colors dark:border-[#261E3D] dark:bg-[#1E1735]"
            >
              <div>
                <div className={`grid size-8 place-items-center rounded-xl ${feat.iconBg}`}>
                  <feat.icon className="size-4" />
                </div>
                <p className="mt-2 mb-0 text-xs font-semibold text-[#1C1633] dark:text-[#F4F2FA] sm:text-sm">
                  {feat.title}
                </p>
              </div>
              <p className="mt-1 mb-0 text-[11px] text-[#8C87A3] dark:text-[#9D97B5] sm:text-xs">
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
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function AddressForm({ onValidated, onCancel }) {
  const [checking, setChecking] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(addressSchema), mode: 'onTouched' });

  async function submit(values) {
    setChecking(true);
    onValidated(await geolocate(values));
    setChecking(false);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="m-0 flex h-full flex-1 flex-col justify-between gap-4 animate-page-enter">
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={sectionTitleClass}>Dirección de entrega</h2>
            <p className="mt-1 mb-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">Paso 1 de 2: ¿Dónde querés recibirla?</p>
          </div>
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-xs font-semibold text-[#8C87A3] hover:underline dark:text-[#9D97B5]">
              Cancelar
            </button>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
          <Field id="street" label="Calle" error={errors.street}>
            <Input id="street" autoComplete="address-line1" className={fieldInputClass} aria-invalid={!!errors.street} {...register('street')} />
          </Field>
          <Field id="number" label="Altura" error={errors.number}>
            <Input id="number" inputMode="numeric" className={`${fieldInputClass} font-mono`} aria-invalid={!!errors.number} {...register('number')} />
          </Field>
        </div>

        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
          <Field id="unit" label="Piso / depto" error={errors.unit}>
            <Input id="unit" placeholder="Opcional" className={fieldInputClass} aria-invalid={!!errors.unit} {...register('unit')} />
          </Field>
          <Field id="city" label="Localidad" error={errors.city}>
            <Input id="city" autoComplete="address-level2" className={fieldInputClass} aria-invalid={!!errors.city} {...register('city')} />
          </Field>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
          <Field id="province" label="Provincia" error={errors.province}>
            <CustomSelect id="province" defaultValue="" aria-invalid={!!errors.province} {...register('province')}>
              <option value="" disabled>Elegí una</option>
              {provinces.map(province => <option key={province} value={province}>{province}</option>)}
            </CustomSelect>
          </Field>
          <Field id="postalCode" label="Código postal" error={errors.postalCode}>
            <Input id="postalCode" autoComplete="postal-code" className={`${fieldInputClass} font-mono uppercase`} aria-invalid={!!errors.postalCode} {...register('postalCode')} />
          </Field>
        </div>
      </div>

      <button type="submit" disabled={checking} className={`${primaryActionClass} mt-4 inline-flex items-center justify-center gap-2`}>
        {checking && <Loader2 className="size-4 animate-spin" />}
        {checking ? 'Revisando la dirección…' : 'Revisar dirección'}
      </button>
    </form>
  );
}

function CardContent({ summary }) {
  const requestPhysicalCard = useWalletStore(state => state.requestPhysicalCard);
  const [showDetails, setShowDetails] = useState(false);
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
    <div className="grid gap-7 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-stretch">
      <section aria-labelledby="virtual-card-title" className={`m-0 flex h-full flex-col justify-between gap-5 border-0 ${panelClass}`}>
        <div className="grid gap-5">
          <h2 id="virtual-card-title" className={sectionTitleClass}>Tarjeta virtual</h2>
          <CardFace
            holderName={fullName}
            lastDigits={summary.card.lastDigits}
            expiry={summary.card.expiry}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails(prev => !prev)}
          />
        </div>
        <dl className="m-0 grid grid-cols-2 gap-3">
          {[
            ['Estado', <span key="status" className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Activa</span>],
            ['Vence', <span key="expiry" className="font-mono">{summary.card.expiry}</span>],
            ['Titular', fullName],
            ['Terminada en', <span key="digits" className="font-mono">{summary.card.lastDigits}</span>],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#F8F7FD] p-3 dark:bg-[#1E1735]">
              <dt className="text-xs text-[#8C87A3] dark:text-[#9D97B5]">{label}</dt>
              <dd className="m-0 mt-0.5 text-sm font-semibold">{value}</dd>
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
                <h2 className={sectionTitleClass}>Confirmá la dirección de entrega</h2>
                <p className="mt-1 mb-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">Paso 2 de 2: Revisá los datos finales.</p>
              </div>
              <div className="flex gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
                <MapPin className="mt-0.5 size-5 shrink-0 text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="m-0 text-sm font-semibold">{formatAddress(validated)}</p>
                  <p className="mt-1 mb-0 font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">
                    {validated.coordinates.lat}, {validated.coordinates.lng}
                  </p>
                </div>
              </div>
              <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">
                Encontramos la dirección en el mapa. Si algo no coincide, corregilo antes de pedir la tarjeta.
              </p>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <button type="button" onClick={() => setValidated(null)} disabled={sending} className={secondaryActionClass}>
                Corregir
              </button>
              <button type="button" onClick={confirm} disabled={sending} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
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
    <AppLayout header={() => <PageHeader title="Mi tarjeta" subtitle="Usá tu tarjeta virtual o pedí la física." />}>
      {summary => <CardContent summary={summary} />}
    </AppLayout>
  );
}
