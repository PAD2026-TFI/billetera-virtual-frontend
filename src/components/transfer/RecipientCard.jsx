import { BadgeCheck, Building2 } from 'lucide-react';
import { formatCuit } from '@/lib/formatters';

function initialsFrom(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

export default function RecipientCard({ recipient }) {
  const isPadi = recipient.bank?.toLowerCase().includes('padi');

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ECE9F5] bg-white p-4 shadow-[0_12px_28px_-20px_rgba(28,22,51,0.16)] dark:border-[#2C2247] dark:bg-[#161028] dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#4C1DB8] font-mono text-xs font-bold text-white shadow-[0_8px_16px_-6px_rgba(76,29,184,0.65)] dark:bg-[#5B2EE0]"
          >
            {initialsFrom(recipient.name || recipient.destination)}
          </span>
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-1.5 truncate text-[15px] font-bold tracking-tight text-[#1C1633] dark:text-[#F4F2FA]">
              <span className="truncate">{recipient.name || recipient.destination}</span>
              <BadgeCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </p>
            <p className="m-0 mt-0.5 truncate font-mono text-xs text-[#6E6888] dark:text-[#9D97B5]">
              {recipient.destination}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isPadi
              ? 'bg-[#FFD54A]/25 text-[#7A5400] ring-1 ring-inset ring-[#E5B822]/40 dark:bg-[#FFD54A]/15 dark:text-[#FFD54A] dark:ring-[#FFD54A]/30'
              : 'bg-[#F3F1F9] text-[#4C1DB8] ring-1 ring-inset ring-[#4C1DB8]/15 dark:bg-[#241B3E] dark:text-[#C4B2FF] dark:ring-[#5B2EE0]/30'
          }`}
        >
          <Building2 className="size-3" aria-hidden="true" />
          {recipient.bank}
        </span>
      </div>

      <dl className="m-0 mt-3 grid grid-cols-2 gap-2 border-t border-[#F0EDF8] pt-3 text-xs dark:border-[#251C3D]">
        <div>
          <dt className="text-[11px] text-[#8C87A3] dark:text-[#7E7699]">CUIT/CUIL</dt>
          <dd className="m-0 mt-0.5 font-mono font-semibold text-[#1C1633] dark:text-[#F4F2FA]">
            {formatCuit(recipient.cuit)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-[11px] text-[#8C87A3] dark:text-[#7E7699]">Estado de cuenta</dt>
          <dd className="m-0 mt-0.5 inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Titular verificado
          </dd>
        </div>
      </dl>
    </div>
  );
}
