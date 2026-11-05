import { Toast } from 'radix-ui';
import { X } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function Toaster() {
  const { toasts, dismissToast } = useNotificationStore();

  return (
    <Toast.Provider duration={5000} label="Notificación">
      {toasts.map(toast => (
        <Toast.Root
          key={toast.id}
          onOpenChange={open => !open && dismissToast(toast.id)}
          className="flex items-center gap-3 rounded-2xl bg-[#1C1633] py-2 pr-2 pl-4 font-[Poppins] text-white shadow-[0_16px_40px_-16px_rgba(28,22,51,0.6)] dark:border dark:border-[#261E3D] dark:bg-[#231A3D]/95 dark:backdrop-blur-md"
        >
          <Toast.Title className="m-0 flex-1 text-sm font-medium">{toast.title}</Toast.Title>
          <Toast.Close
            aria-label="Cerrar aviso"
            className="m-0 grid size-11 shrink-0 place-items-center rounded-full border-0 bg-transparent p-0 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed inset-x-4 bottom-24 z-50 m-0 grid list-none gap-2 p-0 outline-none lg:right-6 lg:bottom-6 lg:left-auto lg:w-96" />
    </Toast.Provider>
  );
}
