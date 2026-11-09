import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ children, className = '', id, ...props }) {
  return (
    <div className="relative w-full">
      <select
        id={id}
        className={`h-11 w-full cursor-pointer appearance-none rounded-2xl border border-transparent bg-[#F3F1F9] px-4 pr-10 text-sm font-medium text-[#1C1633] transition-all duration-150 hover:bg-[#E9E5F6] focus-visible:border-[#5B2EE0] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#5B2EE0]/30 focus-visible:outline-none dark:bg-[#1E1735] dark:text-[#F4F2FA] dark:hover:bg-[#281F45] dark:focus-visible:border-[#5B2EE0] dark:focus-visible:bg-[#140F24] ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[#8C87A3] transition-colors dark:text-[#9D97B5]"
        aria-hidden="true"
      />
    </div>
  );
}
