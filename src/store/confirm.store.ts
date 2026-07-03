import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  resolve: ((value: boolean) => void) | null;
  show: (options: { title?: string; message: string; confirmText?: string; cancelText?: string }) => Promise<boolean>;
  confirm: () => void;
  cancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: 'Xác nhận',
  message: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  resolve: null,
  show: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title ?? 'Xác nhận',
        message: options.message,
        confirmText: options.confirmText ?? 'Xác nhận',
        cancelText: options.cancelText ?? 'Hủy',
        resolve,
      });
    });
  },
  confirm: () => {
    const resolve = get().resolve;
    if (resolve) resolve(true);
    set({ isOpen: false, resolve: null });
  },
  cancel: () => {
    const resolve = get().resolve;
    if (resolve) resolve(false);
    set({ isOpen: false, resolve: null });
  },
}));
