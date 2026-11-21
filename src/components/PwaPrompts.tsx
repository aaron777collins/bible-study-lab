import { useEffect } from "react";
import { toast, TOAST_MS } from "@/lib/toast";
import { registerSW } from "virtual:pwa-register";

/** Toasts for a new version and connection changes. */
export function PwaPrompts() {
  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        toast("A new version is ready", { id: "update", duration: Infinity, action: { label: "Reload", onClick: () => void update(true) } });
      },
      // No toast when the app is ready offline: it arrives a few seconds after the first
      // visit, on top of whatever the person is reading. Settings explains offline use.
    });
    const off = () => toast("You are offline. Chapters you have opened before still work.", { id: "offline", duration: TOAST_MS });
    const on = () => toast.dismiss("offline");
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);
  return null;
}
