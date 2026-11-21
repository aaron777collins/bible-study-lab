import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArcCanvas, type Segment } from "@/components/charts/ArcCanvas";
import { Page } from "@/components/Page";
import { useAsync, useMediaQuery } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS, bookIndexFromSlug } from "@/lib/canon/books";
import { BOOK_START, CHAPTER_START, bookVerseCount, chapterCount, verseCount } from "@/lib/canon/canon";
import { formatVerseId } from "@/lib/canon/parse";
import { connectionsPath, readPath } from "@/lib/nav";
import type { Arc } from "@/lib/xref/arcs";
import { loadSummary, loadXrefBook } from "@/lib/xref/links";

export function Component() {
  const { book: slug } = useParams();
  const book = bookIndexFromSlug(slug ?? "");
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const phone = useMediaQuery("(max-width: 767px)");
  const min = [1, 3, 5, 10, 20].includes(Number(sp.get("min"))) ? Number(sp.get("min")) : 3;
  const [focus, setFocus] = useState<number | null>(null);
  useDocumentTitle(book >= 0 ? `${BOOKS[book].name}: connections` : "Book not found");

  const x = useAsync<Record<string, number[]>>(() => (book >= 0 ? loadXrefBook(book) : Promise.resolve({})), [book]);
  const summary = useAsync(loadSummary, []);
  const start = book >= 0 ? BOOK_START[book] : 0;
  const total = book >= 0 ? bookVerseCount(book) : 1;

  const arcs: Arc[] = useMemo(() => {
    const out: Arc[] = [];
    if (!x.data || book < 0) return out;
    const end = BOOK_START[book + 1];
    for (const [k, flat] of Object.entries(x.data)) {
      const from = Number(k);
      for (let i = 0; i < flat.length; i += 3) {
        const t = flat[i];
        const votes = flat[i + 2];
        if (t < 0 || votes < min || t < start || t >= end) continue;
        out.push({ a: from - start, b: t - start, w: votes, fwd: t > from, from, to: t });
      }
    }
    return out;
  }, [x.data, book, min, start]);

  const segments: Segment[] = useMemo(
    () =>
      book < 0
        ? []
        : CHAPTER_START[book].map((s, i) => ({ start: s - start, end: (CHAPTER_START[book][i + 1] ?? BOOK_START[book + 1]) - start, label: `Chapter ${i + 1}`, short: String(i + 1), testament: BOOKS[book].testament, key: i + 1 })),
    [book, start],
  );
  const heat = useMemo(() => {
    if (!summary.data || book < 0) return undefined;
    const dens = summary.data.chapterWeight[book].map((w, i) => w / verseCount(book, i + 1));
    const max = Math.max(1, ...dens);
    const out: number[] = [0];
    for (const d of dens) out.push(Math.log1p(d) / Math.log1p(max));
    return out;
  }, [summary.data, book]);

  const describe = useCallback((a: Arc) => `${formatVerseId(a.from)} to ${formatVerseId(a.to)}, ${a.w} votes. Click to open.`, []);

  const flows = useMemo(() => {
    if (!summary.data || book < 0) return { out: [], inn: [] };
    const m = summary.data.matrix;
    const out = BOOKS.map((_, j) => ({ j, v: j === book ? 0 : m[book * 66 + j] })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v).slice(0, 8);
    const inn = BOOKS.map((_, j) => ({ j, v: j === book ? 0 : m[j * 66 + book] })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v).slice(0, 8);
    return { out, inn };
  }, [summary.data, book]);

  if (book < 0) {
    return (
      <Page title="Book not found">
        <Link to="/explore">Back to Explore</Link>
      </Page>
    );
  }
  const b = BOOKS[book];
  const maxFlow = Math.max(1, ...flows.out.map((r) => r.v), ...flows.inn.map((r) => r.v));
  const Flows = ({ title, rows }: { title: string; rows: { j: number; v: number }[] }) => (
    <section aria-label={title}>
      <h2 className="mb-2 text-lg">{title}</h2>
      <ul className="grid gap-1.5">
        {rows.map((r) => (
          <li key={r.j} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-2 text-sm">
            <Link to={`/explore/${BOOKS[r.j].slug}`}>{BOOKS[r.j].name}</Link>
            <span className="h-2.5 rounded-sm" style={{ width: `${(r.v / maxFlow) * 100}%`, background: "var(--lapis)", opacity: 0.8 }} aria-hidden="true" />
            <span className="text-right tabular text-muted-foreground">{r.v.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <Page wide title={`${b.name}: connections`} intro={<>Links inside {b.name}, drawn between its verses. Chapters are colored by how many cross references touch each verse, so deeper blue means more connected.</>}>
      <div className="mb-4 flex flex-wrap items-end gap-6">
        <div className="grid gap-1.5">
          <Label id="bmin">Strength (votes)</Label>
          <ToggleGroup type="single" variant="outline" value={String(min)} onValueChange={(v) => v && setSp(new URLSearchParams({ min: v }), { replace: true })} aria-labelledby="bmin">
            {[1, 3, 5, 10, 20].map((n) => <ToggleGroupItem key={n} value={String(n)}>{n === 1 ? "Any" : `${n}+`}</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
        <Link to={readPath(book, 1)} className="pb-2">Read {b.name}</Link>
        <Link to={`/books/${b.slug}`} className="pb-2">About {b.name}</Link>
      </div>
      {x.loading ? <Skeleton className="h-80 w-full" /> : (
        <ArcCanvas
          arcs={arcs}
          domain={total}
          segments={segments}
          focusSegment={focus}
          onFocusSegment={setFocus}
          onOpenSegment={(c) => navigate(readPath(book, c))}
          onArcClick={(a) => navigate(connectionsPath(a.from))}
          describe={describe}
          height={phone ? 200 : 300}
          label={`Arc diagram of links inside ${b.name}`}
          heat={heat}
        />
      )}
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">{x.loading ? "Loading" : `${arcs.length.toLocaleString()} links inside ${b.name} with ${min === 1 ? "any number of" : `${min} or more`} votes. ${chapterCount(book)} chapters.`}</p>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {summary.loading ? <Skeleton className="h-48 w-full" /> : <Flows title={`${b.name} links most to`} rows={flows.out} />}
        {summary.loading ? <Skeleton className="h-48 w-full" /> : <Flows title={`Most linked from`} rows={flows.inn} />}
      </div>
    </Page>
  );
}
