import { useState } from 'react';
import { Loader2, RotateCw, WifiOff } from 'lucide-react';
import { api } from '@/services/api';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function ConnectionBanner() {
  const serviceUnavailable = useNotificationStore(state => state.serviceUnavailable);
  const [checking, setChecking] = useState(false);

  if (!serviceUnavailable) return null;

  async function retry() {
    setChecking(true);
    await api('/health/ready').catch(() => {});
    setChecking(false);
  }

  const RetryIcon = checking ? Loader2 : RotateCw;

  return (
    <div role="alert" className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-[#FFF4CC] px-4 py-1.5 font-[Poppins] text-sm text-[#8A6100] dark:bg-amber-950 dark:text-amber-200">
      <WifiOff className="size-[18px] shrink-0" aria-hidden="true" />
      <p className="m-0">No pudimos conectarnos con el servidor.</p>
      <button
        type="button"
        onClick={retry}
        disabled={checking}
        className="m-0 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-sm font-semibold text-inherit underline-offset-2 hover:underline disabled:opacity-60"
      >
        <RetryIcon className={`size-4 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
