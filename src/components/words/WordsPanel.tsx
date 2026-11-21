import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { fromId } from "@/lib/canon/canon";
import { loadKjvTokens } from "@/lib/data/strongs";
import { LexCard } from "./LexCard";

/** The original-language words for the selected KJV verses. */
export function WordsPanel({ start, end, tr, active, onSwitchKjv, onPick }: { start: number; end: number; tr: string; active: string | null; onSwitchKjv: () => void; onPick: (n: string | null) => void }) {
  const first = fromId(start);
  const tokens = useAsync(() => (tr === "kjv" ? loadKjvTokens(first.book) : Promise.resolve(undefined)), [tr, first.book]);
  const [chosen, setChosen] = useState<string | null>(null);
  const words = useMemo(() => {
    if (!tokens.data) return [];
    const seen = new Map<string, string>();
    for (let id = start; id <= end; id++) {
      const r = fromId(id);
      const vs = tokens.data.c[r.chapter - 1]?.[r.verse - 1];
      if (!vs) continue;
      for (const t of vs) if (Array.isArray(t) && !seen.has(t[1])) seen.set(t[1], t[0]);
    }
    return [...seen].map(([num, word]) => ({ num, word }));
  }, [tokens.data, start, end]);

  if (tr !== "kjv") {
    return (
      <div className="grid gap-3">
        <Alert>
          <AlertDescription>Strong&rsquo;s numbers are tagged to the KJV. Other translations do not have reliable tags here.</AlertDescription>
        </Alert>
        <Button onClick={onSwitchKjv}>Switch to the KJV</Button>
      </div>
    );
  }
  if (tokens.loading) return <Skeleton className="h-32 w-full" />;
  const current = active ?? chosen ?? words[0]?.num ?? null;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">Tap a word to see the Hebrew or Greek behind it.</p>
      <ul className="flex flex-wrap gap-1.5" aria-label="Words with Strong's numbers">
        {words.map((w) => (
          <li key={w.num}>
            <Button
              size="sm"
              variant={current === w.num ? "default" : "outline"}
              aria-pressed={current === w.num}
              onClick={() => {
                setChosen(w.num);
                onPick(w.num);
              }}
            >
              {w.word} <span className="text-xs opacity-80">{w.num}</span>
            </Button>
          </li>
        ))}
      </ul>
      {current && <LexCard num={current} />}
      {!words.length && <p className="text-sm text-muted-foreground">No tagged words in this selection.</p>}
    </div>
  );
}
