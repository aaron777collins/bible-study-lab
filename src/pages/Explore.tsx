import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArcCanvas, type Segment } from "@/components/charts/ArcCanvas";
import { BookFilter } from "@/components/xref/LinkFilterBar";
import { Page } from "@/components/Page";
import { useAsync, useMediaQuery } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS, bookIndexFromOsis } from "@/lib/canon/books";
import { BOOK_START } from "@/lib/canon/canon";
import { formatVerseId } from "@/lib/canon/parse";
import { getBinary } from "@/lib/data/load";
import { connectionsPath } from "@/lib/nav";
import { bookArcs, parseEdges, verseArcs, type TestamentFilter } from "@/lib/xref/arcdata";
import type { Arc } from "@/lib/xref/arcs";
import { loadSummary } from "@/lib/xref/links";

export function Component() {
  useDocumentTitle("Explore cross references");
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const phone = useMediaQuery("(max-width: 767px)");
  const mode = sp.get("mode") === "verses" ? "verses" : sp.get("mode") === "books" ? "books" : phone ? "books" : "verses";
  const min = [5, 10, 20, 50].includes(Number(sp.get("min"))) ? Number(sp.get("min")) : phone ? 20 : 10;
  const from = (["ot", "nt"].includes(sp.get("from") ?? "") ? sp.get("from") : "all") as TestamentFilter;
  const to = (["ot", "nt"].includes(sp.get("to") ?? "") ? sp.get("to") : "all") as TestamentFilter;
  const books = (sp.get("books") ?? "").split(",").map(bookIndexFromOsis).filter((i) => i >= 0);
  const [focus, setFocus] = useState<number | null>(null);

  const setParam = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) (v === null || v === "" ? n.delete(k) : n.set(k, v));
    setSp(n, { replace: true });
  };

  const summary = useAsync(loadSummary, []);
  const edges = useAsync(async () => (mode === "verses" ? parseEdges(await getBinary("xref/edges5.bin")) : undefined), [mode]);

  const arcs: Arc[] = useMemo(() => {
    if (mode === "books") return summary.data ? bookArcs(summary.data.matrix, { from, to, books, top: phone ? 260 : 600 }) : [];
    return edges.data ? verseArcs(edges.data, { min, from, to, books }) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, summary.data, edges.data, min, from, to, books.join(","), phone]);

  const segments: Segment[] = useMemo(
    () => BOOKS.map((b, i) => ({ start: BOOK_START[i], end: BOOK_START[i + 1], label: b.name, short: b.short, testament: b.testament, key: i })),
    [],
  );

  const describe = useCallback(
    (a: Arc) =>
      mode === "books"
        ? `${BOOKS[a.from].name} to ${BOOKS[a.to].name}: ${a.w.toLocaleString()} votes in total`
        : `${formatVerseId(a.from)} to ${formatVerseId(a.to)}, ${a.w} votes. Click to open.`,
    [mode],
  );

  const loading = mode === "books" ? summary.loading : edges.loading;
  const topList = useMemo(() => [...arcs].sort((a, b) => b.w - a.w).slice(0, 40), [arcs]);

  return (
    <Page
      wide
      title="Explore the Bible's connections"
      intro={
        <>
          Every line is a cross reference from the OpenBible.info dataset. Stronger links are darker. Hover a book to see where it points, or choose a book to look inside it.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="grid gap-1.5">
          <Label id="mode">View</Label>
          <ToggleGroup type="single" variant="outline" value={mode} onValueChange={(v) => v && setParam({ mode: v })} aria-labelledby="mode">
            <ToggleGroupItem value="books">By book</ToggleGroupItem>
            <ToggleGroupItem value="verses">Every verse link</ToggleGroupItem>
          </ToggleGroup>
        </div>
        {mode === "verses" && (
          <div className="grid gap-1.5">
            <Label id="min">Strength (votes)</Label>
            <ToggleGroup type="single" variant="outline" value={String(min)} onValueChange={(v) => v && setParam({ min: v })} aria-labelledby="min">
              {[5, 10, 20, 50].map((n) => (
                <ToggleGroupItem key={n} value={String(n)}>{n}+</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
        <div className="grid gap-1.5">
          <Label id="from">From</Label>
          <ToggleGroup type="single" variant="outline" value={from} onValueChange={(v) => v && setParam({ from: v === "all" ? null : v })} aria-labelledby="from">
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="ot">Old</ToggleGroupItem>
            <ToggleGroupItem value="nt">New</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="grid gap-1.5">
          <Label id="to">To</Label>
          <ToggleGroup type="single" variant="outline" value={to} onValueChange={(v) => v && setParam({ to: v === "all" ? null : v })} aria-labelledby="to">
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="ot">Old</ToggleGroupItem>
            <ToggleGroupItem value="nt">New</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="grid gap-1.5">
          <Label>Books</Label>
          <BookFilter value={books} onChange={(b) => setParam({ books: b.map((i) => BOOKS[i].osis).join(",") || null })} />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[340px] w-full" />
      ) : (
        <ArcCanvas
          arcs={arcs}
          domain={31102}
          segments={segments}
          focusSegment={focus}
          onFocusSegment={setFocus}
          onOpenSegment={(k) => navigate(`/explore/${BOOKS[k].slug}`)}
          onArcClick={(a) => (mode === "verses" ? navigate(connectionsPath(a.from)) : navigate(`/explore/${BOOKS[a.from].slug}`))}
          describe={describe}
          height={phone ? 220 : 340}
          label={mode === "books" ? "Arc diagram of links between the 66 books" : "Arc diagram of cross references between verses"}
        />
      )}
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {loading ? "Loading" : mode === "books" ? `Showing the ${arcs.length} strongest book-to-book connections.` : `Showing ${arcs.length.toLocaleString()} links with ${min} or more votes. Pinch or use the buttons to zoom; hold Ctrl and scroll on a computer.`}
      </p>

      <details className="mt-6 rounded-md border">
        <summary className="cursor-pointer px-4 py-3 font-medium">Show as a list</summary>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="py-2 text-left text-muted-foreground">{mode === "books" ? "Strongest book to book connections, by total votes" : "Strongest verse links in this view"}</caption>
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4">From</th>
                <th className="py-2 pr-4">To</th>
                <th className="py-2 text-right">Votes</th>
              </tr>
            </thead>
            <tbody>
              {topList.map((a, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-4">{mode === "books" ? <Link to={`/explore/${BOOKS[a.from].slug}`}>{BOOKS[a.from].name}</Link> : <Link to={connectionsPath(a.from)}>{formatVerseId(a.from)}</Link>}</td>
                  <td className="py-2 pr-4">{mode === "books" ? BOOKS[a.to].name : <Link to={connectionsPath(a.to)}>{formatVerseId(a.to)}</Link>}</td>
                  <td className="py-2 text-right tabular">{a.w.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link to="/path">Find a path between two verses</Link></Button>
        <Button asChild variant="outline"><Link to="/insights">See the most connected verses</Link></Button>
      </div>
    </Page>
  );
}
