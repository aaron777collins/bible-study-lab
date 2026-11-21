import { Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefs, type ThemeChoice } from "@/lib/prefs";

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ThemeChoice, string> = { system: "matches your device", light: "Day", dark: "Vigil (dark)" };

/** One button that steps through: match my device, Day, Vigil. A small menu would pull in a lot of code for the first screen. */
export function ThemeToggle() {
  const theme = usePrefs((s) => s.theme);
  const set = usePrefs((s) => s.set);
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : SunMoon;
  return (
    <Button variant="ghost" size="icon" aria-label={`Theme: ${LABEL[theme]}. Press to change`} title={`Theme: ${LABEL[theme]}`} onClick={() => set({ theme: NEXT[theme] })}>
      <Icon aria-hidden="true" />
    </Button>
  );
}
