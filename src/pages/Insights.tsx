import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ScrollTabsList } from "@/components/ScrollTabsList";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Page } from "@/components/Page";
import { MarkedText } from "@/components/VerseText";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS, bookIndexFromOsis } from "@/lib/canon/books";
import { chapterCount, verseCount } from "@/lib/canon/canon";
import { formatVerseId } from "@/lib/canon/parse";
import { getJson } from "@/lib/data/load";
import { verseText } from "@/lib/data/text";
import { bookTotals } from "@/lib/xref/arcdata";
import { connectionsPath, readPath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { loadSummary } from "@/lib/xref/links";
import { translationById, TRANSLATIONS } from "@/lib/translations";

const shade = (t: number) => `color-mix(in oklab, var(--lapis) ${Math.round(8 + t * 82)}%, var(--surface))`;
const logScale = (v: number, max: number) => (v <= 0 ? 0 : Math.log1p(v) / Math.log1p(max));

function VersePreview({ id }: { id: number }) {
  const tr = usePrefs((s) => s.translation);
  const t = useAsync(() => verseText(tr, id), [id, tr]);
  return <span className="block text-sm text-muted-foreground" style={{ fontFamily: "var(--font-scripture)" }}>{t.data ? <MarkedText text={t.data} /> : <Skeleton className="mt-1 h-4 w-full" />}</span>;
}

function TopVerses({ rows, measure }: { rows: [number, number, number][]; measure: "weight" | "count" }) {
  const max = Math.max(1, ...rows.map((r) => (measure === "weight" ? r[1] : r[2])));
  return (
    <ol className="grid gap-1">
      {rows.slice(0, 50).map(([id, w, c], i) => {
        const v = measure === "weight" ? w : c;
        return (
          <li key={id} className="grid grid-cols-[2rem_1fr] gap-2 border-b py-2 last:border-0">
            <span className="text-right text-sm text-muted-foreground tabular">{i + 1}</span>
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <Link to={connectionsPath(id)} className="font-semibold">{formatVerseId(id)}</Link>
                <span className="text-sm text-muted-foreground tabular">{measure === "weight" ? `${w.toLocaleString()} votes in ${c.toLocaleString()} links` : `${c.toLocaleString()} links, ${w.toLocaleString()} votes`}</span>
              </div>
              <div className="my-1 h-1.5 rounded-full bg-wash" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: "var(--lapis)" }} /></div>
              <VersePreview id={id} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function BookBars({ perVerse }: { perVerse: boolean }) {
  const s = useAsync(loadSummary, []);
  const rows = useMemo(() => {
    if (!s.data) return [];
    return bookTotals(s.data.bookOut, s.data.bookIn).sort((a, b) => (perVerse ? b.perVerseOut + b.perVerseIn - (a.perVerseOut + a.perVerseIn) : b.total - a.total));
  }, [s.data, perVerse]);
  if (!s.data) return <Skeleton className="h-96 w-full" />;
  const val = (r: (typeof rows)[number], k: "in" | "out") => (perVerse ? (k === "in" ? r.perVerseIn : r.perVerseOut) : r[k]);
  const max = Math.max(...rows.map((r) => val(r, "in") + val(r, "out")));
  return (
    <div>
      <ul className="grid gap-1" aria-label="Books by cross reference votes">
        {rows.map((r) => {
          const out = val(r, "out");
          const inn = val(r, "in");
          return (
            <li key={r.book} className="grid grid-cols-[6.5rem_1fr_5rem] items-center gap-2 text-sm">
              <Link to={`/explore/${BOOKS[r.book].slug}`}>{BOOKS[r.book].name}</Link>
              <span className="flex h-3.5 overflow-hidden rounded-sm bg-wash" role="img" aria-label={`${BOOKS[r.book].name}: ${Math.round(out).toLocaleString()} votes going out, ${Math.round(inn).toLocaleString()} coming in`}>
                <span style={{ width: `${(out / max) * 100}%`, background: "var(--lapis)" }} />
                <span style={{ width: `${(inn / max) * 100}%`, background: "var(--gilt)" }} />
              </span>
              <span className="text-right tabular text-muted-foreground">{Math.round(out + inn).toLocaleString()}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm" style={{ background: "var(--lapis)" }} aria-hidden="true" /> links going out from the book</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded-sm" style={{ background: "var(--gilt)" }} aria-hidden="true" /> links coming in</span>
      </p>
    </div>
  );
}

function BookFlows() {
  const s = useAsync(loadSummary, []);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [pick, setPick] = useState<{ r: number; c: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const on = () => setWidth(el.clientWidth);
    on();
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => ro.disconnect();
  }, [s.data]);
  if (!s.data) return <Skeleton className="h-96 w-full" />;
  const m = s.data.matrix;
  const max = Math.max(...m);
  // Labels are 11px, so a cell is never smaller than 12px. A wide card scales the grid up to fill it; a narrow one scrolls.
  const padL = 48;
  const padT = 48;
  const cell = Math.min(24, Math.max(12, Math.floor(((width || 0) - 16 - padL - 2) / 66)));
  const top = [...m.map((v, i) => ({ v, i }))].filter((x) => x.v > 0 && Math.floor(x.i / 66) !== x.i % 66).sort((a, b) => b.v - a.v).slice(0, 20);
  const readout = pick ? `${BOOKS[pick.r].name} to ${BOOKS[pick.c].name}: ${m[pick.r * 66 + pick.c].toLocaleString()} votes` : "Hover or tap a square to see the books and the number of votes.";
  return (
    <div className="grid gap-4">
      <p className="sticky top-14 z-10 min-h-6 bg-page py-1 text-sm font-medium" role="status" data-testid="flow-readout">{readout}</p>
      <div ref={box} className="max-w-full overflow-x-auto rounded-md border bg-surface p-2">
        <svg width={padL + 66 * cell + 2} height={padT + 66 * cell + 2} role="img" aria-label="Heat grid of cross reference votes from each book (rows) to each book (columns). A table with the strongest pairs follows." style={{ display: "block" }} onPointerLeave={() => setPick(null)}>
          {BOOKS.map((b, i) => (
            <g key={b.osis} fontSize={11} fill="var(--ink-muted)" fontWeight={pick && (pick.r === i || pick.c === i) ? 700 : 400}>
              <text x={padL + i * cell + cell / 2 + 4} y={padT - 5} textAnchor="start" transform={`rotate(-90 ${padL + i * cell + cell / 2 + 4} ${padT - 5})`}>{b.osis}</text>
              <text x={padL - 4} y={padT + i * cell + cell / 2 + 4} textAnchor="end">{b.osis}</text>
            </g>
          ))}
          {Array.from({ length: 66 * 66 }, (_, k) => {
            const v = m[k];
            const r = Math.floor(k / 66);
            const c = k % 66;
            return (
              <rect
                key={k}
                x={padL + c * cell}
                y={padT + r * cell}
                width={cell - 1}
                height={cell - 1}
                fill={v > 0 ? shade(logScale(v, max)) : "var(--wash)"}
                stroke={pick && pick.r === r && pick.c === c ? "var(--ink)" : undefined}
                strokeWidth={pick && pick.r === r && pick.c === c ? 2 : undefined}
                onPointerEnter={() => setPick({ r, c })}
                onClick={() => setPick({ r, c })}
              >
                <title>{`${BOOKS[r].name} to ${BOOKS[c].name}: ${v.toLocaleString()} votes`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">Rows are the book a link starts in, columns are where it points. The bright diagonal is links inside one book. Hover or tap a square for the numbers.</p>
      <details className="rounded-md border">
        <summary className="cursor-pointer px-4 py-3 font-medium">Show as a list</summary>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[26rem] text-left text-sm">
            <caption className="py-2 text-left text-muted-foreground">Strongest connections between two books (links inside a book are left out)</caption>
            <thead><tr className="border-b"><th className="py-2">From</th><th className="py-2">To</th><th className="py-2 text-right">Votes</th></tr></thead>
            <tbody>
              {top.map(({ v, i }) => (
                <tr key={i} className="border-b last:border-0"><td className="py-2">{BOOKS[Math.floor(i / 66)].name}</td><td className="py-2">{BOOKS[i % 66].name}</td><td className="py-2 text-right tabular">{v.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function ChapterHeat({ density }: { density: boolean }) {
  const s = useAsync(loadSummary, []);
  const data = useMemo(() => {
    if (!s.data) return null;
    const cw = s.data.chapterWeight;
    const vals = cw.map((row, b) => row.map((w, c) => (density ? w / verseCount(b, c + 1) : w)));
    return { vals, max: Math.max(...vals.flat()) };
  }, [s.data, density]);
  if (!data) return <Skeleton className="h-96 w-full" />;
  const flat = data.vals.flatMap((row, b) => row.map((v, c) => ({ b, c: c + 1, v }))).sort((x, y) => y.v - x.v).slice(0, 30);
  return (
    <div className="grid gap-4">
      <div className="max-h-[70dvh] max-w-full overflow-auto rounded-md border bg-surface" tabIndex={0} role="region" aria-label="Chapter heat map, scrolls sideways">
        <div className="inline-block min-w-full p-2">
          {BOOKS.map((b, bi) => (
            <div key={b.osis} className="flex items-center" style={{ height: 26 }}>
              <span className="sticky left-0 z-10 w-28 shrink-0 bg-surface pr-2 text-right text-xs text-muted-foreground">{b.name}</span>
              {data.vals[bi].map((v, ci) => (
                <Link
                  key={ci}
                  to={readPath(bi, ci + 1)}
                  aria-label={`${b.name} ${ci + 1}, ${density ? Math.round(v) : v.toLocaleString()} ${density ? "votes per verse" : "votes"}`}
                  title={`${b.name} ${ci + 1}: ${density ? v.toFixed(1) + " per verse" : v.toLocaleString() + " votes"}`}
                  className="mr-0.5 block shrink-0 rounded-[3px]"
                  style={{ width: 24, height: 24, background: v > 0 ? shade(logScale(v, data.max)) : "var(--wash)" }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
        <span>Fewer links</span>
        <span className="h-3 w-40 rounded-sm" style={{ background: `linear-gradient(to right, ${shade(0)}, ${shade(1)})` }} />
        <span>More links (log scale)</span>
      </div>
      <details className="rounded-md border">
        <summary className="cursor-pointer px-4 py-3 font-medium">Show as a list</summary>
        <ol className="grid gap-1 px-4 pb-4 text-sm">
          {flat.map((r) => <li key={`${r.b}-${r.c}`}><Link to={readPath(r.b, r.c)}>{BOOKS[r.b].name} {r.c}</Link> <span className="text-muted-foreground">{density ? r.v.toFixed(1) + " votes per verse" : r.v.toLocaleString() + " votes"}</span></li>)}
        </ol>
      </details>
    </div>
  );
}

interface WordInsight { words: number; verses: number; chapterWords: number[]; top: [string, number][]; distinct: [string, number, number][] }

function Words({ osis, tr, onOsis, onTr }: { osis: string; tr: string; onOsis: (o: string) => void; onTr: (t: string) => void }) {
  const d = useAsync(() => getJson<Record<string, WordInsight>>(`insights/${osis}.json`), [osis]);
  const bible = useAsync(() => getJson<Record<string, { words: number; unique: number; top: [string, number][] }>>("insights/bible.json"), []);
  const bi = bookIndexFromOsis(osis);
  const ins = d.data?.[tr];
  const List = ({ title, rows, note }: { title: string; rows: [string, number][]; note?: string }) => {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return (
      <section aria-label={title}>
        <h3 className="mb-1 text-lg">{title}</h3>
        {note && <p className="mb-2 text-sm text-muted-foreground">{note}</p>}
        <ul className="grid gap-1">
          {rows.map(([w, n]) => (
            <li key={w} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-2 text-sm">
              <Link to={`/search?q=${encodeURIComponent(w)}&t=${tr}&scope=${osis}`}>{w}</Link>
              <span className="h-2.5 rounded-sm" style={{ width: `${(n / max) * 100}%`, background: "var(--lapis)", opacity: 0.8 }} aria-hidden="true" />
              <span className="text-right tabular text-muted-foreground">{n}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  };
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="wbook">Book</Label>
          <Select value={osis} onValueChange={onOsis}>
            <SelectTrigger id="wbook" className="w-48"><SelectValue>{BOOKS[bi].name}</SelectValue></SelectTrigger>
            <SelectContent className="max-h-80">{BOOKS.map((b) => <SelectItem key={b.osis} value={b.osis}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label id="wtr">Translation</Label>
          <ToggleGroup type="single" variant="outline" value={tr} onValueChange={(v) => v && onTr(v)} aria-labelledby="wtr">
            {TRANSLATIONS.map((t) => <ToggleGroupItem key={t.id} value={t.id}>{t.short}</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
      </div>
      {!ins ? <Skeleton className="h-72 w-full" /> : (
        <>
          <p className="text-sm text-muted-foreground">{BOOKS[bi].name} has {ins.words.toLocaleString()} words in {chapterCount(bi)} {chapterCount(bi) === 1 ? "chapter" : "chapters"} in the {translationById(tr).short}. The longest chapter is chapter {ins.chapterWords.indexOf(Math.max(...ins.chapterWords)) + 1}, with {Math.max(...ins.chapterWords).toLocaleString()} words.</p>
          <div className="grid gap-8 md:grid-cols-2">
            <List title="Most used words" rows={ins.top.slice(0, 20)} note="Small words such as the and of are left out." />
            <List title="Words this book leans on" rows={ins.distinct.slice(0, 20).map(([w, n]) => [w, n] as [string, number])} note="Words used here far more than in the rest of the Bible, by TF-IDF." />
          </div>
        </>
      )}
      {bible.data?.[tr] && (
        <section aria-label="The whole Bible">
          <h3 className="mb-1 text-lg">The whole Bible</h3>
          <p className="mb-2 text-sm text-muted-foreground">{bible.data[tr].words.toLocaleString()} words, {bible.data[tr].unique.toLocaleString()} different words. Most used words after the small ones:</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{bible.data[tr].top.slice(0, 24).map(([w, n]) => <span key={w}><Link to={`/search?q=${encodeURIComponent(w)}&t=${tr}`}>{w}</Link> <span className="text-muted-foreground tabular">{n.toLocaleString()}</span></span>)}</p>
        </section>
      )}
    </div>
  );
}

export function Component() {
  useDocumentTitle("Insights");
  const [sp, setSp] = useSearchParams();
  const prefTr = usePrefs((s) => s.translation);
  const tab = ["verses", "books", "flows", "chapters", "words"].includes(sp.get("tab") ?? "") ? sp.get("tab")! : "verses";
  const set = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) (v === null ? n.delete(k) : n.set(k, v));
    setSp(n, { replace: true });
  };
  const s = useAsync(loadSummary, []);
  const measure = sp.get("by") === "count" ? "count" : "weight";
  const perVerse = sp.get("per") === "verse";
  const density = sp.get("heat") === "density";
  const osis = BOOKS.some((b) => b.osis === sp.get("book")) ? sp.get("book")! : "John";
  const wtr = TRANSLATIONS.some((t) => t.id === sp.get("t")) ? sp.get("t")! : prefTr;

  return (
    <Page wide title="Insights" intro={<>What the {s.data ? s.data.positiveLinks.toLocaleString() : "345,000"} cross references say about the shape of Scripture: the most connected verses, which books lean on which, and the words each book returns to.</>}>
      <Tabs value={tab} onValueChange={(v) => set({ tab: v })}>
        <ScrollTabsList value={tab}>
          <TabsTrigger value="verses">Top verses</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="flows">Book flows</TabsTrigger>
          <TabsTrigger value="chapters">Chapter heat map</TabsTrigger>
          <TabsTrigger value="words">Words</TabsTrigger>
        </ScrollTabsList>
        <TabsContent value="verses" className="mt-6 max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl">Most referenced verses</h2>
            <ToggleGroup type="single" variant="outline" size="sm" value={measure} onValueChange={(v) => v && set({ by: v === "weight" ? null : v })} aria-label="Rank by">
              <ToggleGroupItem value="weight">By votes</ToggleGroupItem>
              <ToggleGroupItem value="count">By number of links</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {s.data ? <TopVerses rows={measure === "weight" ? s.data.topWeight : s.data.topCount} measure={measure} /> : <Skeleton className="h-96 w-full" />}
        </TabsContent>
        <TabsContent value="books" className="mt-6 max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl">Most referenced books</h2>
            <ToggleGroup type="single" variant="outline" size="sm" value={perVerse ? "verse" : "total"} onValueChange={(v) => v && set({ per: v === "verse" ? "verse" : null })} aria-label="Measure">
              <ToggleGroupItem value="total">Total votes</ToggleGroupItem>
              <ToggleGroupItem value="verse">Per verse</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <BookBars perVerse={perVerse} />
        </TabsContent>
        <TabsContent value="flows" className="mt-6">
          <h2 className="mb-4 text-xl">Book flows</h2>
          <BookFlows />
        </TabsContent>
        <TabsContent value="chapters" className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-xl">Chapter heat map</h2>
            <ToggleGroup type="single" variant="outline" size="sm" value={density ? "density" : "total"} onValueChange={(v) => v && set({ heat: v === "density" ? "density" : null })} aria-label="Measure">
              <ToggleGroupItem value="total">Total votes</ToggleGroupItem>
              <ToggleGroupItem value="density">Per verse</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <ChapterHeat density={density} />
        </TabsContent>
        <TabsContent value="words" className="mt-6 max-w-5xl">
          <h2 className="mb-4 text-xl">Words</h2>
          <Words osis={osis} tr={wtr} onOsis={(o) => set({ book: o })} onTr={(t) => set({ t })} />
        </TabsContent>
      </Tabs>
      <p className="mt-8 text-sm text-muted-foreground">Cross reference data from OpenBible.info, licensed CC BY 4.0. <Button variant="link" className="h-auto p-0" asChild><Link to="/about">About the data</Link></Button></p>
    </Page>
  );
}
