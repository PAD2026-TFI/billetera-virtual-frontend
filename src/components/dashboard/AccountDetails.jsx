import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function AccountDetails({ cvu, alias }) {
  return (
    <section aria-labelledby="account-title" className="m-0 rounded-none border-0 bg-transparent p-0 shadow-none">
      <h2 id="account-title" className="mt-0 mb-3 text-base font-semibold text-[#1C1633] dark:text-[#F4F2FA]">Datos para recibir dinero</h2>
      <dl className="m-0 divide-y divide-[#ECE9F5] rounded-[20px] bg-white px-5 lg:bg-[#F8F7FD] dark:divide-[#261E3D] dark:border dark:border-[#261E3D] dark:bg-[#140F24]">
        <CopyRow label="CVU" value={cvu} />
        <CopyRow label="Alias" value={alias} />
      </dl>
    </section>
  );
}

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <dt className="text-[13px] text-[#8C87A3] dark:text-[#9D97B5]">{label}</dt>
        <dd className="m-0 mt-1 truncate font-mono text-[13px] sm:text-[15px] lg:text-[13px] text-[#1C1633] dark:text-[#F4F2FA]">{value}</dd>
      </div>
      <button
        type="button"
        onClick={copyValue}
        aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
        className="m-0 inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border-0 bg-[#F3F1F9] px-4 lg:w-11 lg:px-0 text-sm font-semibold text-[#4C1DB8] hover:bg-[#E9E5F6] dark:bg-[#1E1735] dark:text-[#B9A6FF] dark:hover:bg-[#281F45]"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span className="lg:sr-only">{copied ? 'Copiado' : 'Copiar'}</span>
      </button>
    </div>
  );
}
