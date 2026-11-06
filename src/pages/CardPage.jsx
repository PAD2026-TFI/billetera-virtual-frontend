import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2, MapPin, Wifi } from 'lucide-react';
import AppLayout, { PageHeader, panelClass } from '@/components/layout/AppLayout';
import Field from '@/components/forms/Field';
import { Input } from '@/components/ui/input';
import { fieldInputClass, primaryActionClass, secondaryActionClass, sectionTitleClass } from '@/components/forms/formStyles';
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

function CardFace({ holderName, lastDigits, expiry }) {
  return (
    <div
      role="img"
      aria-label={`Tarjeta virtual terminada en ${lastDigits}, vence ${expiry}`}
      className="relative aspect-[1.586] w-full max-w-sm overflow-hidden rounded-[24px] bg-gradient-to-br from-[#7A4DFF] to-[#3A1299] p-6 text-white shadow-[0_22px_40px_-20px_rgba(58,18,153,0.75)]"
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
        <div className="h-8 w-11 rounded-md bg-gradient-to-br from-[#FFE27A] to-[#E6B422]" />
        <div>
          <p className="m-0 font-mono text-lg tracking-[0.16em]">•••• •••• •••• {lastDigits}</p>
          <div className="mt-2 flex justify-between text-sm text-white/85">
            <span>{holderName}</span>
            <span className="font-mono">{expiry}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestTracker({ request }) {
  const current = requestSteps.findIndex(step => step.id === request.status);
  return (
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
      <div className="flex gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
        <MapPin className="mt-0.5 size-5 shrink-0 text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="m-0 text-sm font-semibold">Se entrega en</p>
          <p className="m-0 text-sm text-[#4A4560] dark:text-[#9D97B5]">{formatAddress(request.address)}</p>
        </div>
      </div>
      <p className="m-0 font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">Solicitud {request.id}</p>
    </div>
  );
}

function AddressForm({ onValidated }) {
  const [checking, setChecking] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(addressSchema), mode: 'onTouched' });

  async function submit(values) {
    setChecking(true);
    onValidated(await geolocate(values));
    setChecking(false);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="m-0 grid max-w-none gap-4">
      <div>
        <h2 className={sectionTitleClass}>Pedí tu tarjeta física</h2>
        <p className="mt-1 mb-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">Te la enviamos sin costo. Revisamos la dirección para que llegue bien.</p>
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
          <select id="province" defaultValue="" className={`${fieldInputClass} w-full appearance-none`} aria-invalid={!!errors.province} {...register('province')}>
            <option value="" disabled>Elegí una</option>
            {provinces.map(province => <option key={province} value={province}>{province}</option>)}
          </select>
        </Field>
        <Field id="postalCode" label="Código postal" error={errors.postalCode}>
          <Input id="postalCode" autoComplete="postal-code" className={`${fieldInputClass} font-mono uppercase`} aria-invalid={!!errors.postalCode} {...register('postalCode')} />
        </Field>
      </div>
      <button type="submit" disabled={checking} className={`${primaryActionClass} mt-2 inline-flex items-center justify-center gap-2`}>
        {checking && <Loader2 className="size-4 animate-spin" />}
        {checking ? 'Revisando la dirección…' : 'Revisar dirección'}
      </button>
    </form>
  );
}

function CardContent({ summary }) {
  const requestPhysicalCard = useWalletStore(state => state.requestPhysicalCard);
  const [validated, setValidated] = useState(null);
  const [sending, setSending] = useState(false);
  const fullName = `${summary.holder.firstName} ${summary.holder.lastName}`;

  async function confirm() {
    setSending(true);
    await requestPhysicalCard(validated);
    setSending(false);
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      <section aria-labelledby="virtual-card-title" className={`m-0 grid gap-5 border-0 ${panelClass}`}>
        <h2 id="virtual-card-title" className={sectionTitleClass}>Tarjeta virtual</h2>
        <CardFace holderName={fullName} lastDigits={summary.card.lastDigits} expiry={summary.card.expiry} />
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

      <div className={panelClass}>
        {summary.cardRequest ? (
          <RequestTracker request={summary.cardRequest} />
        ) : validated ? (
          <div className="grid gap-5">
            <h2 className={sectionTitleClass}>Confirmá la dirección de entrega</h2>
            <div className="flex gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
              <MapPin className="mt-0.5 size-5 shrink-0 text-[#4C1DB8] dark:text-[#B9A6FF]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold">{formatAddress(validated)}</p>
                <p className="mt-1 mb-0 font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">
                  {validated.coordinates.lat}, {validated.coordinates.lng}
                </p>
              </div>
            </div>
            <p className="m-0 text-sm text-[#8C87A3] dark:text-[#9D97B5]">Encontramos la dirección en el mapa. Si algo no coincide, corregilo antes de pedir la tarjeta.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setValidated(null)} disabled={sending} className={secondaryActionClass}>Corregir</button>
              <button type="button" onClick={confirm} disabled={sending} className={`${primaryActionClass} inline-flex items-center justify-center gap-2`}>
                {sending && <Loader2 className="size-4 animate-spin" />}
                {sending ? 'Pidiendo…' : 'Pedir tarjeta'}
              </button>
            </div>
          </div>
        ) : (
          <AddressForm onValidated={setValidated} />
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
