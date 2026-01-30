
import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  show: (
    message: string,
    type?: ToastType,
    options?: { actionLabel?: string; onAction?: () => void | Promise<void>; durationMs?: number },
  ) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = "info", options) => {
    const id = Math.random().toString(36).substring(2, 9);
    const durationMs = Math.max(1000, options?.durationMs ?? 3000);
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          message,
          type,
          actionLabel: options?.actionLabel,
          onAction: options?.onAction,
          durationMs,
        },
      ],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, durationMs);
  },
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
