import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePrefs } from "@/lib/prefs";

/** Reading comfort controls, used in the reader and in Settings. */
export function ReadingOptions() {
  const p = usePrefs();
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="text-size">Text size</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm" aria-hidden="true">A</span>
          <Slider id="text-size" min={0} max={4} step={1} value={[p.textSize]} onValueChange={([v]) => p.set({ textSize: v })} aria-label="Text size" />
          <span className="text-xl" aria-hidden="true">A</span>
        </div>
      </div>
      <div className="grid gap-2">
        <Label id="spacing-label">Line spacing</Label>
        <ToggleGroup type="single" variant="outline" value={String(p.spacing)} onValueChange={(v) => v && p.set({ spacing: Number(v) })} aria-labelledby="spacing-label">
          <ToggleGroupItem value="0">Compact</ToggleGroupItem>
          <ToggleGroupItem value="1">Normal</ToggleGroupItem>
          <ToggleGroupItem value="2">Roomy</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid gap-2">
        <Label id="layout-label">Layout</Label>
        <ToggleGroup type="single" variant="outline" value={p.verseLayout} onValueChange={(v) => v && p.set({ verseLayout: v as "paragraphs" | "verses" })} aria-labelledby="layout-label">
          <ToggleGroupItem value="paragraphs">Paragraphs</ToggleGroupItem>
          <ToggleGroupItem value="verses">One verse per line</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid gap-2">
        <Label id="font-label">Reading font</Label>
        <ToggleGroup type="single" variant="outline" value={p.font} onValueChange={(v) => v && p.set({ font: v as "serif" | "sans" })} aria-labelledby="font-label">
          <ToggleGroupItem value="serif">Serif (Gentium)</ToggleGroupItem>
          <ToggleGroupItem value="sans">Easy to read (Atkinson)</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="red-letter">Words of Jesus in red (KJV and WEB)</Label>
        <Switch id="red-letter" checked={p.redLetter} onCheckedChange={(v) => p.set({ redLetter: v })} />
      </div>
    </div>
  );
}
