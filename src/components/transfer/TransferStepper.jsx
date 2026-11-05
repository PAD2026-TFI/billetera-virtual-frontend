const steps = ['Destinatario', 'Importe', 'Confirmación', 'Comprobante'];

export default function TransferStepper({ current }) {
  return (
    <ol aria-label="Pasos de la transferencia" className="m-0 grid list-none grid-cols-4 gap-2 p-0">
      {steps.map((label, index) => {
        const isCurrent = index === current;
        return (
          <li key={label} aria-current={isCurrent ? 'step' : undefined} className="grid content-start gap-1.5">
            <span className={`h-1.5 rounded-full ${index <= current ? 'bg-[#4C1DB8] dark:bg-[#5B2EE0]' : 'bg-[#E2DCF5] dark:bg-[#261E3D]'}`} />
            <span className={`text-xs font-medium ${isCurrent ? 'text-[#1C1633] dark:text-[#F4F2FA]' : 'sr-only text-[#8C87A3] sm:not-sr-only dark:text-[#6B6485]'}`}>
              <span className="font-mono">{index + 1}.</span> {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
