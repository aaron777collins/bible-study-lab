import { useEffect } from "react";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

/** Toasts for a new version, offline readiness and connection changes. */
export function PwaPrompts() {
  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        toast("A new version is ready", { id: "update", duration: Infinity, action: { label: "Reload", onClick: () => void update(true) } });
      },
      onOfflineReady() {
        toast("Ready to use offline. Chapters you open are saved on this device.", { id: "offline-ready", duration: 6000 });
      },
    });
    const off = () => toast("You are offline. Chapters you have opened before still work.", { id: "offline", duration: 6000 });
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
