import { Toaster } from "@/components/ui/sonner";
import { usePrefs } from "@/lib/prefs";
import { FirstSaveDialog } from "./FirstSaveDialog";
import { PwaPrompts } from "./PwaPrompts";

/** Things that are not needed for the first paint: toasts, the first-save warning and the service worker prompts. */
export default function DeferredUi() {
  const theme = usePrefs((s) => s.theme);
  return (
    <>
      <FirstSaveDialog />
      <PwaPrompts />
      <Toaster theme={theme} position="bottom-center" offset={{ bottom: 64 }} mobileOffset={{ bottom: "calc(120px + env(safe-area-inset-bottom))" }} />
    </>
  );
}
