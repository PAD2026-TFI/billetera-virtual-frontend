import { groupByDay } from '@/lib/movements';
import MovementRow from './MovementRow';

export default function MovementsList({ movements, onSelect, now }) {
  const groups = groupByDay(movements, now);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {groups.map(group => (
        <section key={group.key} aria-labelledby={`day-${group.key}`} className="m-0 rounded-none border-0 bg-transparent p-0 shadow-none">
          <h3 id={`day-${group.key}`} className="m-0 mb-1 px-2 text-xs font-semibold tracking-wide text-[#8C87A3] uppercase sm:px-3 dark:text-[#9D97B5]">
            {group.label}
          </h3>
          <ul className="m-0 list-none divide-y divide-[#ECE9F5] p-0 dark:divide-[#261E3D]">
            {group.items.map(movement => (
              <MovementRow key={movement.id} movement={movement} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
