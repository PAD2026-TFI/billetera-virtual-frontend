import { Toast } from 'radix-ui';
import { ArrowDownLeft, Bell, X } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function Toaster() {
  const { toasts, dismissToast } = useNotificationStore();

  return (
    <Toast.Provider duration={5000} label="Notificación">
      {toasts.map(toast => {
        const isTransfer =
          toast.type === 'transfer' ||
          (typeof toast.title === 'string' && toast.title.toLowerCase().includes('transferencia'));

        return (
          <Toast.Root
            key={toast.id}
            onOpenChange={open => !open && dismissToast(toast.id)}
            className="flex items-center gap-3 rounded-2xl border border-[#ECE9F5] bg-white p-3 font-[Poppins] text-[#1C1633] shadow-[0_16px_40px_-16px_rgba(28,22,51,0.25)] dark:border-[#261E3D] dark:bg-[#1E1735]/95 dark:text-white dark:backdrop-blur-md"
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                isTransfer
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-[#EDE7FC] text-[#5B2EE0] dark:bg-[#281F45] dark:text-[#FFD54A]'
              }`}
            >
              {isTransfer ? (
                <ArrowDownLeft className="size-4.5 stroke-[2.2]" aria-hidden="true" />
              ) : (
                <Bell className="size-4.5 stroke-[2.2]" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <Toast.Title className="m-0 text-xs font-semibold tracking-tight text-[#1C1633] sm:text-sm dark:text-white">
                {toast.title}
              </Toast.Title>
              {toast.description && (
                <Toast.Description className="m-0 mt-0.5 text-[11px] text-[#6E6888] dark:text-[#9D97B5]">
                  {toast.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close
              aria-label="Cerrar aviso"
              className="m-0 grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0 text-[#8C87A3] transition-colors hover:bg-[#F3F1F9] hover:text-[#1C1633] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="size-4" aria-hidden="true" />
            </Toast.Close>
          </Toast.Root>
        );
      })}
      <Toast.Viewport className="fixed inset-x-4 bottom-24 z-50 m-0 grid list-none gap-2 p-0 outline-none lg:right-6 lg:bottom-6 lg:left-auto lg:w-96" />
    </Toast.Provider>
  );
}
