import { create } from 'zustand';

export const useNotificationStore = create(set => ({
  toasts: [],
  serviceUnavailable: false,

  notify: title => set(state => ({ toasts: [...state.toasts, { id: crypto.randomUUID(), title }] })),
  dismissToast: id => set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
  setServiceUnavailable: serviceUnavailable => set({ serviceUnavailable }),
}));
