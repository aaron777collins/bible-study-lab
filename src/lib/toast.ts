import { toast as base, type ExternalToast } from "sonner";

/** How long a toast stays, in milliseconds. */
export const TOAST_MS = 4000;

type Fn = (message: Parameters<typeof base>[0], data?: ExternalToast) => string | number;
const timers = new Map<string | number, ReturnType<typeof setTimeout>>();

/**
 * Sonner pauses a toast's timer while the pointer is over it, so a toast that
 * appears under a resting cursor would never go away. Every toast also gets its
 * own hard timeout here, so none can stay on screen.
 */
function wrap(fn: Fn): Fn {
  return (message, data) => {
    const duration = data?.duration ?? TOAST_MS;
    const id = fn(message, { ...data, duration });
    const old = timers.get(id);
    if (old) clearTimeout(old);
    if (Number.isFinite(duration)) {
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          base.dismiss(id);
        }, duration + 500),
      );
    }
    return id;
  };
}

export const toast = Object.assign(wrap(base as Fn), {
  success: wrap(base.success as Fn),
  error: wrap(base.error as Fn),
  info: wrap(base.info as Fn),
  warning: wrap(base.warning as Fn),
  dismiss: (id?: string | number) => {
    if (id !== undefined) {
      const t = timers.get(id);
      if (t) clearTimeout(t);
      timers.delete(id);
    }
    return base.dismiss(id);
  },
});
