import { Input } from '@/components/ui/input';
import { fieldInputClass } from './formStyles';

export default function MoneyInput({ className = '', ...props }) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-lg font-semibold text-[#8C87A3]">$</span>
      <Input inputMode="decimal" autoComplete="off" placeholder="0,00" className={`${fieldInputClass} h-14 pl-10 font-mono text-xl font-semibold ${className}`} {...props} />
    </div>
  );
}
