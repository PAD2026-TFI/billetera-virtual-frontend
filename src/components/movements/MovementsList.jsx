import { formatCurrency } from '@/lib/formatters';
import { groupByDay } from '@/lib/movements';
import MovementRow from './MovementRow';

function dayNet(items) {
  let sum = 0;
  for (const item of items) {
    if (item.status === 'completed') sum += item.amount;
  }
  return Math.round(sum * 100) / 100;
}

export default function MovementsList({ movements, onSelect, now }) {
  const groups = groupByDay(movements, now);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {groups.map(group => {
        const net = dayNet(group.items);
        const isPositive = net >= 0;

        return (
          <section
            key={group.key}
            aria-labelledby={`day-${group.key}`}
            className="m-0 rounded-none border-0 bg-transparent p-0 shadow-none"
          >
            <div className="mb-2 flex items-center gap-3 px-2 sm:px-3">
              <h3
                id={`day-${group.key}`}
                className="m-0 shrink-0 text-xs font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]"
              >
                {group.label}
              </h3>
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-gradient-to-r from-[#E6E1F4] via-[#ECE9F5] to-transparent dark:from-[#2B2244] dark:via-[#201935]"
              />
              <span
                aria-hidden="true"
                className="shrink-0 font-mono text-[11px] font-medium text-[#8C87A3] tabular-nums dark:text-[#7E7699]"
              >
                {isPositive ? '+' : '−'}{formatCurrency(Math.abs(net))}
              </span>
            </div>

            <ul className="m-0 list-none divide-y divide-[#F0EDF8] rounded-2xl border border-[#ECE9F5]/80 bg-[#FCFBFD] p-1 dark:divide-[#211936] dark:border-[#261E3D]/90 dark:bg-[#110C1F]/60">
              {group.items.map(movement => (
                <MovementRow key={movement.id} movement={movement} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
