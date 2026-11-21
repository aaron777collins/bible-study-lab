import { Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePrefs, type ThemeChoice } from "@/lib/prefs";

export function ThemeToggle() {
  const theme = usePrefs((s) => s.theme);
  const set = usePrefs((s) => s.set);
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : SunMoon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Theme: ${theme}. Change theme`}>
          <Icon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => set({ theme: v as ThemeChoice })}>
          <DropdownMenuRadioItem value="system">Match my device</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">Day</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Vigil (dark)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
