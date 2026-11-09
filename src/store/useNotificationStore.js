import { create } from 'zustand';

export const useNotificationStore = create(set => ({
  toasts: [],
  serviceUnavailable: false,

  notify: (title, description, type = 'info') =>
    set(state => ({
      toasts: [
        ...state.toasts,
        {
          id: crypto.randomUUID(),
          title: typeof title === 'object' ? title.title : title,
          description: typeof title === 'object' ? title.description : description,
          type: typeof title === 'object' ? (title.type || 'info') : type,
        },
      ],
    })),
  dismissToast: id => set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
  setServiceUnavailable: serviceUnavailable => set({ serviceUnavailable }),
}));
