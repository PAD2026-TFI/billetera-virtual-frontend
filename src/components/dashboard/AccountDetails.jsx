import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';

export default function AccountDetails({ cvu, alias }) {
  return (
    <section aria-labelledby="account-title" className="m-0 rounded-none border-0 bg-transparent p-0 shadow-none">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="account-title" className="m-0 text-base font-bold tracking-tight text-[#1C1633] dark:text-[#F4F2FA]">
          Datos para recibir dinero
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25">
          <ShieldCheck className="size-3" aria-hidden="true" />
          24/7
        </span>
      </div>

      <dl className="m-0 grid gap-2.5">
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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ECE9F5] bg-[#FAF9FE] px-4 py-3 transition-colors hover:border-[#4C1DB8]/25 dark:border-[#261E3D] dark:bg-[#19122C] dark:hover:border-[#3D335A]">
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold tracking-wider text-[#6E6888] uppercase dark:text-[#9D97B5]">
          {label}
        </dt>
        <dd className="m-0 mt-0.5 truncate font-mono text-[13px] font-semibold text-[#1C1633] sm:text-sm lg:text-[13px] dark:text-[#F4F2FA]">
          {value}
        </dd>
      </div>

      <button
        type="button"
        onClick={copyValue}
        aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
        className={`m-0 inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border-0 px-3.5 text-xs font-semibold transition-all lg:w-10 lg:px-0 ${
          copied
            ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-inset ring-emerald-500/30 dark:bg-emerald-400/20 dark:text-emerald-300'
            : 'bg-white text-[#4C1DB8] shadow-xs ring-1 ring-inset ring-[#ECE9F5] hover:bg-[#EDE7FC] dark:bg-[#241B3E] dark:text-[#FFD54A] dark:ring-[#342856] dark:hover:bg-[#2F2450]'
        }`}
      >
        {copied ? <Check className="size-4 stroke-[2.3]" /> : <Copy className="size-4" />}
        <span className="lg:sr-only">{copied ? 'Copiado' : 'Copiar'}</span>
      </button>
    </div>
  );
}
