import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MarkedText } from "@/components/VerseText";
import { StrengthBar } from "@/components/xref/ConnectionsList";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toId } from "@/lib/canon/canon";
import { formatVerseId, parseRef, passageStartId } from "@/lib/canon/parse";
import { verseText } from "@/lib/data/text";
import { connectionsPath, versePath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { getGraph } from "@/lib/xref/graphClient";
import type { PathStep } from "@/lib/xref/graph";

const PRESETS: { label: string; a: string; b: string }[] = [
  { label: "The first promise to the Lamb of God", a: "Gen 3:15", b: "Rev 12:9" },
  { label: "Isaac's question to John's answer", a: "Gen 22:8", b: "John 1:29" },
  { label: "By his wounds, you were healed", a: "Isa 53:5", b: "1 Pet 2:24" },
];

function toVerseId(input: string): { id: number } | { error: string } | null {
  if (!input.trim()) return null;
  const r = parseRef(input);
  if (!r.ok) return { error: r.error };
  return { id: passageStartId(r.passages[0]) };
}

function StepCard({ step, index, last, tr }: { step: PathStep; index: number; last: boolean; tr: string }) {
  const text = useAsync(() => verseText(tr, step.id), [step.id, tr]);
  return (
    <li className="relative">
      {index > 0 && (
        <div className="flex items-center gap-2 py-2 pl-3 text-sm text-muted-foreground">
          <ArrowDown className="size-4" aria-hidden="true" />
          <StrengthBar votes={step.votes} top={Math.max(step.votes, 50)} />
        </div>
      )}
      <div className="rounded-md border bg-surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">
            <span className="mr-2 text-sm font-normal text-muted-foreground">{index === 0 ? "Start" : last ? "End" : `Step ${index}`}</span>
            <Link to={versePath(step.id)}>{formatVerseId(step.id)}</Link>
          </p>
          <Link to={connectionsPath(step.id)} className="text-sm">Connections</Link>
        </div>
        <p className="mt-1" style={{ fontFamily: "var(--font-scripture)" }}>{text.data ? <MarkedText text={text.data} /> : <Skeleton className="h-5 w-full" />}</p>
      </div>
    </li>
  );
}

export function Component() {
  useDocumentTitle("Path between two verses");
  const [sp, setSp] = useSearchParams();
  const tr = usePrefs((s) => s.translation);
  const min = [5, 10, 20, 50].includes(Number(sp.get("min"))) ? Number(sp.get("min")) : 10;
  const [aText, setAText] = useState(sp.get("a") ?? "");
  const [bText, setBText] = useState(sp.get("b") ?? "");
  useEffect(() => {
    setAText(sp.get("a") ?? "");
    setBText(sp.get("b") ?? "");
  }, [sp]);
  const a = toVerseId(sp.get("a") ?? "");
  const b = toVerseId(sp.get("b") ?? "");
  const aErr = a && "error" in a ? a.error : null;
  const bErr = b && "error" in b ? b.error : null;
  const aId = a && "id" in a ? a.id : null;
  const bId = b && "id" in b ? b.id : null;

  const result = useAsync(async () => {
    if (aId === null || bId === null) return null;
    const g = await getGraph();
    return g.find(aId, bId, min, 8);
  }, [aId, bId, min]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = new URLSearchParams(sp);
    n.set("a", aText.trim());
    n.set("b", bText.trim());
    setSp(n);
  };
  const setMin = (v: string) => {
    const n = new URLSearchParams(sp);
    n.set("min", v);
    setSp(n, { replace: true });
  };

  const r = result.data;
  return (
    <Page title="Find a path between two verses" intro={<>Pick any two verses. The app follows cross references with at least {min} votes and shows the shortest route, choosing the one whose weakest link is as strong as possible.</>}>
      <form onSubmit={submit} className="grid gap-4 rounded-md border bg-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="pa">From</Label>
            <Input id="pa" value={aText} onChange={(e) => setAText(e.target.value)} placeholder="Gen 22:8" aria-invalid={!!aErr} aria-describedby={aErr ? "pa-err" : undefined} />
            {aErr && <p id="pa-err" className="text-sm text-destructive">{aErr}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pb">To</Label>
            <Input id="pb" value={bText} onChange={(e) => setBText(e.target.value)} placeholder="John 1:29" aria-invalid={!!bErr} aria-describedby={bErr ? "pb-err" : undefined} />
            {bErr && <p id="pb-err" className="text-sm text-destructive">{bErr}</p>}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label id="pmin">Weakest link allowed (votes)</Label>
          <ToggleGroup type="single" variant="outline" value={String(min)} onValueChange={(v) => v && setMin(v)} aria-labelledby="pmin" className="justify-start">
            {[5, 10, 20, 50].map((n) => <ToggleGroupItem key={n} value={String(n)}>{n}+</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
        <div><Button type="submit">Find the path</Button></div>
      </form>

      {aId === null && bId === null && !aErr && !bErr && (
        <section className="mt-8" aria-label="Examples">
          <h2 className="mb-3 text-xl">Try one of these</h2>
          <ul className="grid gap-2">
            {PRESETS.map((p) => (
              <li key={p.label}>
                <Link to={`/path?a=${encodeURIComponent(p.a)}&b=${encodeURIComponent(p.b)}`} className="block rounded-md border bg-surface p-3 no-underline hover:bg-accent">
                  <span className="font-medium text-foreground">{p.a} to {p.b}</span>
                  <span className="block text-sm text-muted-foreground">{p.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {aId !== null && bId !== null && (
        <section className="mt-8" aria-live="polite" aria-label="Result">
          {result.loading ? (
            <Skeleton className="h-40 w-full" />
          ) : result.error ? (
            <Alert variant="destructive"><AlertDescription>Could not load the link graph. Check your connection and try again.</AlertDescription></Alert>
          ) : r && r.steps >= 0 ? (
            <>
              <h2 className="mb-1 text-xl">{r.steps === 0 ? "Same verse" : `${r.steps} ${r.steps === 1 ? "step" : "steps"}`}</h2>
              <p className="mb-4 text-sm text-muted-foreground">{formatVerseId(aId)} to {formatVerseId(bId)}, using links of {min} or more votes.</p>
              <ol className="max-w-2xl">{r.paths[0].map((s, i) => <StepCard key={s.id} step={s} index={i} last={i === r.paths[0].length - 1} tr={tr} />)}</ol>
              {r.paths.length > 1 && (
                <details className="mt-6 max-w-2xl rounded-md border">
                  <summary className="cursor-pointer px-4 py-3 font-medium">{r.paths.length - 1} other {r.paths.length === 2 ? "route" : "routes"} of the same length</summary>
                  <div className="grid gap-4 px-4 pb-4">
                    {r.paths.slice(1).map((p, i) => (
                      <p key={i} className="text-sm">
                        {p.map((s, k) => (
                          <span key={s.id}>
                            {k > 0 && <span className="text-muted-foreground"> then </span>}
                            <Link to={connectionsPath(s.id)}>{formatVerseId(s.id, { short: true })}</Link>
                          </span>
                        ))}
                        <span className="text-muted-foreground"> (weakest link {Math.min(...p.slice(1).map((s) => s.votes))} votes)</span>
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </>
          ) : (
            <Alert>
              <AlertDescription>No path with links of {min} or more votes within 8 steps. {min > 5 ? "Try a lower strength." : "These verses may sit far apart in the cross reference web."}</AlertDescription>
            </Alert>
          )}
          {r && r.shared.length > 0 && (
            <section className="mt-6 max-w-2xl" aria-label="Shared connections">
              <h3 className="mb-2 text-lg">Verses linked to both</h3>
              <ul className="flex flex-wrap gap-2">
                {r.shared.map((s) => (
                  <li key={s.id}>
                    <Button asChild variant="outline" size="sm"><Link to={connectionsPath(s.id)}>{formatVerseId(s.id, { short: true })} <span className="text-xs text-muted-foreground">{s.votes}</span></Link></Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      )}
    </Page>
  );
}

export { toId };
