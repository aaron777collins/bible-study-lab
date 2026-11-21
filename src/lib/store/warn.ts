import { create } from "zustand";
import { getDb } from "./db";
import { readMeta, requestPersistence, setMeta } from "./meta";

interface WarnState {
  open: boolean;
  /** set by the dialog component so tests and headless use are never blocked */
  registered: boolean;
  resolve: (() => void) | null;
}
export const useWarn = create<WarnState>(() => ({ open: false, registered: false, resolve: null }));

let pending: Promise<void> | null = null;

/**
 * Call before the first write. The first time ever, shows the "your notes live only in this browser" dialog
 * and waits for the person to answer. After that it returns at once.
 */
export function guardWrite(): Promise<void> {
  if (pending) return pending;
  pending = (async () => {
    const db = await getDb();
    if (!db) return;
    const meta = await readMeta();
    if (meta.warnedAt) return;
    if (useWarn.getState().registered) {
      await new Promise<void>((resolve) => useWarn.setState({ open: true, resolve }));
    }
    await setMeta("warnedAt", Date.now());
    void requestPersistence();
  })().finally(() => {
    pending = null;
  });
  return pending;
}

export function closeWarn() {
  const { resolve } = useWarn.getState();
  useWarn.setState({ open: false, resolve: null });
  resolve?.();
}
