import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setHighlight } from "@/lib/store/repo";
import { HIGHLIGHT_COLORS, HIGHLIGHT_LABEL, type HighlightColor } from "@/lib/store/types";

export function HighlightPicker({ ids, current, onChanged }: { ids: number[]; current?: HighlightColor; onChanged?: () => void }) {
  const apply = async (c: HighlightColor | null) => {
    for (const id of ids) await setHighlight(id, c);
    onChanged?.();
  };
  return (
    <div role="group" aria-label="Highlight color" className="flex flex-wrap items-center gap-2">
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`${HIGHLIGHT_LABEL[c]} highlight`}
          aria-pressed={current === c}
          onClick={() => apply(c)}
          className="grid size-11 place-items-center rounded-full border-2 sm:size-9"
          style={{ background: `var(--hl-${c})`, borderColor: current === c ? "var(--ink)" : "var(--rule)" }}
        >
          <span className="hl-mark" data-c={c} style={{ margin: 0 }} aria-hidden="true" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={() => apply(null)} aria-label="Remove highlight">
        <Eraser aria-hidden="true" /> Clear
      </Button>
    </div>
  );
}
