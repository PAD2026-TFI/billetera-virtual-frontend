import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs } from 'radix-ui';
import { AtSign, Loader2, UserRound } from 'lucide-react';
import { IconInput } from '@/components/auth/IconInput';
import Field from '@/components/forms/Field';
import { alertClass, fieldInputClass, primaryActionClass, secondaryActionClass } from '@/components/forms/formStyles';
import { frequentContacts, lookupRecipient } from '@/services/mocks/walletService';
import RecipientCard from './RecipientCard';

const destinationSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(1, 'Ingresá un alias, CVU o CBU.')
    .refine(value => /^\d{22}$/.test(value) || /^[a-zA-Z0-9.-]{6,20}$/.test(value), 'El alias tiene de 6 a 20 caracteres; el CVU y el CBU, 22 números.'),
});

const tabClass =
  'm-0 h-10 flex-1 rounded-full border-0 bg-transparent px-3 text-sm font-semibold text-[#4A4560] data-[state=active]:bg-white data-[state=active]:text-[#4C1DB8] data-[state=active]:shadow-sm dark:text-[#9D97B5] dark:data-[state=active]:bg-[#281F45] dark:data-[state=active]:text-[#F4F2FA]';

export default function RecipientStep({ account, onConfirm }) {
  const [recipient, setRecipient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(destinationSchema), mode: 'onTouched' });

  async function search(destination) {
    const key = destination.trim().toLowerCase();
    setRecipient(null);
    setError('');
    if (key === account.alias || key === account.cvu) {
      setError('No podés transferirte a tu propia cuenta.');
      return;
    }
    setSearching(true);
    const found = await lookupRecipient(key);
    setSearching(false);
    if (found) setRecipient(found);
    else setError('No encontramos una cuenta con ese alias, CVU o CBU.');
  }

  return (
    <div className="grid gap-5">
      <Tabs.Root defaultValue="frequent" onValueChange={() => { setRecipient(null); setError(''); }} className="grid gap-4">
        <Tabs.List aria-label="Elegí el destinatario" className="flex gap-1 rounded-full bg-[#F3F1F9] p-1 dark:bg-[#1E1735]">
          <Tabs.Trigger value="frequent" className={tabClass}>Contactos frecuentes</Tabs.Trigger>
          <Tabs.Trigger value="new" className={tabClass}>Nuevo destinatario</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="frequent">
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {frequentContacts.map(contact => (
              <li key={contact.destination}>
                <button
                  type="button"
                  onClick={() => search(contact.destination)}
                  disabled={searching}
                  className="m-0 flex w-full items-center gap-3 rounded-2xl border-0 bg-[#F8F7FD] p-3 text-left hover:bg-[#F3F1F9] disabled:opacity-60 dark:bg-[#1E1735] dark:hover:bg-[#281F45]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E6DFFB] text-[#4C1DB8] dark:bg-[#281F45] dark:text-[#B9A6FF]">
                    <UserRound className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#1C1633] dark:text-[#F4F2FA]">{contact.name}</span>
                    <span className="block truncate font-mono text-xs text-[#8C87A3] dark:text-[#9D97B5]">{contact.destination}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Tabs.Content>

        <Tabs.Content value="new">
          <form onSubmit={handleSubmit(values => search(values.destination))} noValidate className="m-0 grid max-w-none gap-3">
            <Field id="destination" label="Alias, CVU o CBU" error={errors.destination}>
              <IconInput icon={AtSign} id="destination" autoComplete="off" placeholder="nombre.apellido.padi" className={`${fieldInputClass} pl-11`} aria-invalid={!!errors.destination} {...register('destination')} />
            </Field>
            <button type="submit" disabled={searching} className={secondaryActionClass}>Buscar cuenta</button>
          </form>
        </Tabs.Content>
      </Tabs.Root>

      <div aria-live="polite" className="grid gap-4">
        {searching && (
          <p className="m-0 flex items-center gap-2 text-sm text-[#4A4560] dark:text-[#9D97B5]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Verificando titularidad…
          </p>
        )}
        {error && <p role="alert" className={alertClass}>{error}</p>}
        {recipient && (
          <>
            <RecipientCard recipient={recipient} />
            <button type="button" onClick={() => onConfirm(recipient)} className={primaryActionClass}>Continuar</button>
          </>
        )}
      </div>
    </div>
  );
}
