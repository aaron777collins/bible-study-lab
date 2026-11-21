import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotesBanner } from "@/components/NotesBanner";
import { Page } from "@/components/Page";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatRange, parseRef, passageEndId, passageStartId } from "@/lib/canon/parse";
import { plain, rangeText } from "@/lib/data/text";
import { versePath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { useStoreQuery } from "@/lib/store/hooks";
import { addMemory, listMemory, restore, saveMemory, softDelete } from "@/lib/store/repo";
import { BOX_INTERVAL_DAYS, cue, review } from "@/lib/store/memorize";
import type { MemoryItem } from "@/lib/store/types";
import { translationById } from "@/lib/translations";

function useText(item: MemoryItem | undefined, tr: string) {
  const [text, setText] = useState("");
  useEffect(() => {
    let alive = true;
    setText("");
    if (item) rangeText(tr, item.start, item.end, 20).then((v) => alive && setText(v.map(([, t]) => plain(t)).join(" ")));
    return () => {
      alive = false;
    };
  }, [item?.id, item?.start, item?.end, tr]); // eslint-disable-line react-hooks/exhaustive-deps
  return text;
}

function ReviewCard({ item, tr, onDone }: { item: MemoryItem; tr: string; onDone: () => void }) {
  const text = useText(item, tr);
  const [shown, setShown] = useState(false);
  useEffect(() => setShown(false), [item.id]);
  const mark = async (ok: boolean) => {
    await saveMemory(review(item, ok));
    toast(ok ? `Moved up to box ${Math.min(5, item.box + 1)}. Next review in ${BOX_INTERVAL_DAYS[Math.min(5, item.box + 1)]} days.` : "Back to box 1. You will see it again soon.");
    onDone();
  };
  return (
    <div className="rounded-xl border bg-surface p-5">
      <p className="text-sm text-muted-foreground">Box {item.box} of 5</p>
      <h2 className="mb-3 text-xl">{formatRange(item.start, item.end > item.start ? item.end : 0)}</h2>
      <p className="scripture !max-w-none text-[1.1875rem]" aria-live="polite">{shown ? text : cue(text, item.box)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!shown ? (
          <Button onClick={() => setShown(true)}>Show the verse</Button>
        ) : (
          <>
            <Button onClick={() => mark(true)}>I knew it</Button>
            <Button variant="outline" onClick={() => mark(false)}>Not yet</Button>
          </>
        )}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Say the verse out loud first, then check. The higher the box, the less of the verse is shown.</p>
    </div>
  );
}

export function Component() {
  useDocumentTitle("Memorize");
  const tr = usePrefs((s) => s.translation);
  const { data: items } = useStoreQuery(listMemory, []);
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const due = useMemo(() => items.filter((m) => m.dueAt <= Date.now()), [items]);
  const first = due[0];

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseRef(ref);
    if (!r.ok) return setError(r.error);
    setError("");
    const p = r.passages[0];
    const saved = await addMemory(passageStartId(p), passageEndId(p));
    if (saved) {
      toast.success("Added to your memory verses");
      setRef("");
    } else toast.error("Notes cannot be saved in this window.");
  };

  return (
    <Page title="Memorize" intro="Learn verses by heart with spaced review. Verses you know well come back less often. Everything stays in this browser.">
      <NotesBanner className="mb-6" />
      <form onSubmit={add} className="mb-8 flex max-w-xl flex-wrap items-end gap-2">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Label htmlFor="mref">Add a verse or short passage</Label>
          <Input id="mref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ps 23:1-3" aria-invalid={!!error} aria-describedby={error ? "mref-err" : undefined} />
          {error && <p id="mref-err" className="text-sm text-destructive">{error}</p>}
        </div>
        <Button type="submit">Add</Button>
      </form>

      <section aria-label="Review" className="mb-8">
        <h2 className="mb-3 text-xl">Review</h2>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-muted-foreground">No memory verses yet. Add one above. A short verse you love is a good start.</p>
        ) : due.length === 0 ? (
          <p className="rounded-md border bg-surface p-4">Nothing is due. Come back tomorrow, or add another verse.</p>
        ) : reviewing && first ? (
          <ReviewCard item={first} tr={tr} onDone={() => (due.length <= 1 ? setReviewing(false) : undefined)} />
        ) : (
          <div className="rounded-md border bg-surface p-4">
            <p className="mb-3">{due.length} {due.length === 1 ? "verse is" : "verses are"} ready.</p>
            <Button onClick={() => setReviewing(true)}>Start review</Button>
          </div>
        )}
      </section>

      {items.length > 0 && (
        <section aria-label="Your verses">
          <h2 className="mb-3 text-xl">Your verses ({translationById(tr).short})</h2>
          <ul className="grid gap-2">
            {items.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-surface px-3 py-2.5">
                <div>
                  <Link to={versePath(m.start)} className="font-semibold">{formatRange(m.start, m.end > m.start ? m.end : 0)}</Link>
                  <p className="text-sm text-muted-foreground">Box {m.box} of 5. {m.dueAt <= Date.now() ? "Due now." : `Next review ${new Date(m.dueAt).toLocaleDateString()}.`}</p>
                </div>
                <Button size="icon-sm" variant="ghost" aria-label={`Remove ${formatRange(m.start, m.end > m.start ? m.end : 0)}`} onClick={async () => { await softDelete("memory", m.id); toast("Removed", { action: { label: "Undo", onClick: () => restore("memory", m.id) } }); }}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}
