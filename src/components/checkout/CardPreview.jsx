import { detectCardBrand, onlyDigits } from '@/lib/cards';

const faceClass = 'absolute inset-0 grid rounded-[20px] p-5 text-white backface-hidden shadow-[0_20px_40px_-20px_rgba(42,14,122,0.8)]';
const surfaceClass = 'bg-[linear-gradient(135deg,#2A0E7A_0%,#4C1DB8_55%,#6C3BF4_100%)]';

function maskedNumber(number) {
  const digits = onlyDigits(number).padEnd(16, '•');
  return digits.replace(/(.{4})(?=.)/g, '$1 ');
}

export default function CardPreview({ number, holder, expiry, cvv, flipped }) {
  const brand = detectCardBrand(number);

  return (
    <div aria-hidden="true" className="mx-auto aspect-[1.586] w-full max-w-[320px] perspective-distant">
      <div className={`relative size-full transform-3d motion-safe:transition-transform motion-safe:duration-500 ${flipped ? 'rotate-y-180' : ''}`}>
        <div className={`${faceClass} ${surfaceClass} content-between`}>
          <div className="flex items-start justify-between">
            <span className="h-8 w-11 rounded-md bg-[linear-gradient(135deg,#FFE664,#C9A227)]" />
            <span className="text-sm font-semibold tracking-wide">{brand ?? 'Tarjeta'}</span>
          </div>
          <p className="m-0 font-mono text-lg tracking-[0.12em] sm:text-xl">{maskedNumber(number)}</p>
          <div className="flex items-end justify-between gap-4 text-xs">
            <div className="min-w-0">
              <p className="m-0 text-[10px] text-white/60 uppercase">Titular</p>
              <p className="m-0 truncate font-medium uppercase">{holder || 'Nombre y apellido'}</p>
            </div>
            <div className="text-right">
              <p className="m-0 text-[10px] text-white/60 uppercase">Vence</p>
              <p className="m-0 font-mono font-medium">{expiry || 'MM/AA'}</p>
            </div>
          </div>
        </div>
        <div className={`${faceClass} ${surfaceClass} rotate-y-180 content-center gap-3 px-0`}>
          <span className="h-10 w-full bg-[#090613]" />
          <div className="flex items-center gap-3 px-5">
            <span className="h-8 flex-1 rounded bg-white/80" />
            <span className="rounded bg-white px-3 py-1.5 font-mono text-sm text-[#1C1633]">{cvv || '•••'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
