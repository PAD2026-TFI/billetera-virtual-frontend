import { BadgeCheck } from 'lucide-react';
import { formatCuit } from '@/lib/formatters';

export default function RecipientCard({ recipient }) {
  const rows = [
    { label: 'CUIT/CUIL', value: formatCuit(recipient.cuit) },
    { label: 'Entidad', value: recipient.bank, plain: true },
    { label: 'Alias o CVU', value: recipient.destination },
  ];

  return (
    <div className="grid gap-3 rounded-2xl bg-[#F8F7FD] p-4 dark:bg-[#1E1735]">
      <p className="m-0 flex items-center gap-2 font-semibold text-[#1C1633] dark:text-[#F4F2FA]">
        <BadgeCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        {recipient.name}
      </p>
      <dl className="m-0 grid gap-1.5 text-sm">
        {rows.map(row => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-[#8C87A3] dark:text-[#9D97B5]">{row.label}</dt>
            <dd className={`m-0 min-w-0 text-right break-all text-[#1C1633] dark:text-[#F4F2FA] ${row.plain ? '' : 'font-mono'}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
