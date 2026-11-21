import { useEffect } from "react";
import { toast } from "sonner";

/** Toasts for a new version, offline readiness and connection changes. Filled in by the PWA step. */
export function PwaPrompts() {
  useEffect(() => {
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
