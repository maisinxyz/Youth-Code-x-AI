import { create } from "zustand";

export type ToastKind = "error" | "success" | "info";

export type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  add: (kind: ToastKind, message: string) => void;
  remove: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (kind, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    // Auto-dismiss after 5s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helpers — call from anywhere without hooks
export const toast = {
  error:   (message: string) => useToastStore.getState().add("error",   message),
  success: (message: string) => useToastStore.getState().add("success", message),
  info:    (message: string) => useToastStore.getState().add("info",    message),
};
