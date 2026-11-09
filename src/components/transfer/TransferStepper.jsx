import { Check } from 'lucide-react';

const steps = ['Destinatario', 'Importe', 'Confirmación', 'Comprobante'];

export default function TransferStepper({ current }) {
  return (
    <div className="grid gap-2">
      <ol aria-label="Pasos de la transferencia" className="m-0 grid list-none grid-cols-4 gap-2.5 p-0">
        {steps.map((label, index) => {
          const isCurrent = index === current;
          const isCompleted = index < current;

          return (
            <li
              key={label}
              aria-current={isCurrent ? 'step' : undefined}
              className="grid content-start gap-2"
            >
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#ECE8F8] dark:bg-[#231B3A]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    isCompleted
                      ? 'w-full bg-emerald-500 dark:bg-emerald-400'
                      : isCurrent
                      ? 'w-full bg-gradient-to-r from-[#4C1DB8] to-[#7A4DFF] dark:from-[#5B2EE0] dark:to-[#FFD54A]'
                      : 'w-0'
                  }`}
                />
              </div>

              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  isCurrent
                    ? 'text-[#1C1633] dark:text-[#F4F2FA]'
                    : isCompleted
                    ? 'sr-only text-emerald-700 sm:not-sr-only sm:inline-flex dark:text-emerald-400'
                    : 'sr-only text-[#8C87A3] sm:not-sr-only sm:inline-flex dark:text-[#6B6485]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-4 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300'
                      : isCurrent
                      ? 'bg-[#4C1DB8] text-white dark:bg-[#FFD54A] dark:text-[#1C1633]'
                      : 'bg-[#ECE8F8] text-[#6E6888] dark:bg-[#231B3A] dark:text-[#8C87A3]'
                  }`}
                >
                  {isCompleted ? <Check className="size-2.5 stroke-[3]" /> : index + 1}
                </span>
                <span className="truncate">{label}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between sm:hidden">
        <p className="m-0 text-xs font-semibold text-[#4C1DB8] dark:text-[#FFD54A]">
          Paso {current + 1} de 4 · {steps[current]}
        </p>
      </div>
    </div>
  );
}
