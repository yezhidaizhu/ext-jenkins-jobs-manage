import { readonly, ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

const toasts = ref<ToastItem[]>([]);
let nextToastId = 1;

export function showToast(toast: { type?: ToastType; message: string }) {
  const id = nextToastId++;

  toasts.value.push({
    id,
    type: toast.type ?? 'info',
    message: toast.message,
  });

  window.setTimeout(() => {
    dismissToast(id);
  }, 3000);
}

export function dismissToast(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

export function useToasts() {
  return {
    toasts: readonly(toasts),
    dismissToast,
  };
}
