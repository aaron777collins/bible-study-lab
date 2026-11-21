import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { BookOpen, Compass } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EgoGraph } from "@/components/charts/EgoGraph";
import { ConnectionsList } from "@/components/xref/ConnectionsList";
import { LinkFilterBar } from "@/components/xref/LinkFilterBar";
import { MarkedText } from "@/components/VerseText";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS, bookIndexFromOsis, bookIndexFromSlug } from "@/lib/canon/books";
import { fromId, isValidRef, toId } from "@/lib/canon/canon";
import { formatRange, formatVerseId } from "@/lib/canon/parse";
import { rangeText, verseText } from "@/lib/data/text";
import { connectionsPath, versePath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { isTranslationId, translationById } from "@/lib/translations";
import { buildEgo } from "@/lib/xref/ego";
import { DEFAULT_FILTER, filterLinks, linksForVerse, type LinkFilter } from "@/lib/xref/links";

export function Component() {
  const p = useParams();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const prefTr = usePrefs((s) => s.translation);
  const tr = isTranslationId(sp.get("tr") ?? "") ? sp.get("tr")! : prefTr;

  const book = bookIndexFromSlug(p.book ?? "");
  const ch = Number(p.chapter);
  const vs = Number(p.verse);
  const ok = book >= 0 && isValidRef(book, ch, vs);
  const id = ok ? toId(book, ch, vs) : 0;
  useDocumentTitle(ok ? `Connections for ${formatVerseId(id)}` : "Verse not found");

  const filter: LinkFilter = {
    minVotes: [1, 5, 10, 20, 50].includes(Number(sp.get("min"))) ? Number(sp.get("min")) : DEFAULT_FILTER.minVotes,
    testament: sp.get("t") === "ot" || sp.get("t") === "nt" ? (sp.get("t") as "ot" | "nt") : "all",
    books: (sp.get("books") ?? "").split(",").map(bookIndexFromOsis).filter((i) => i >= 0),
    direction: sp.get("dir") === "out" || sp.get("dir") === "in" ? (sp.get("dir") as "out" | "in") : "both",
    showDisputed: sp.get("disputed") === "1",
  };
  const group = sp.get("group") === "1";
  const ring2 = sp.get("ring2") === "1";
  const trail = (sp.get("trail") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 31102).slice(-5);

  const setFilter = (f: LinkFilter) => {
    const n = new URLSearchParams(sp);
    const put = (k: string, v: string | null) => (v === null ? n.delete(k) : n.set(k, v));
    put("min", f.minVotes === 1 ? null : String(f.minVotes));
    put("t", f.testament === "all" ? null : f.testament);
    put("books", f.books.length ? f.books.map((b) => BOOKS[b].osis).join(",") : null);
    put("dir", f.direction === "both" ? null : f.direction);
    put("disputed", f.showDisputed ? "1" : null);
    setSp(n, { replace: true });
  };
  const setFlag = (k: string, v: boolean) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, "1");
    else n.delete(k);
    setSp(n, { replace: true });
  };

  const links = useAsync(() => (ok ? linksForVerse(id) : Promise.resolve([])), [id, ok]);
  const filtered = useMemo(() => filterLinks(links.data ?? [], filter), [links.data, sp.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = useAsync(() => (ok ? verseText(tr, id) : Promise.resolve("")), [id, tr, ok]);
  const ring1 = useMemo(() => filtered.slice(0, 12), [filtered]);
  const second = useAsync(async () => {
    if (!ring2 || !ok) return null;
    const m = new Map<number, Awaited<ReturnType<typeof linksForVerse>>>();
    await Promise.all(ring1.map(async (l) => m.set(l.id, filterLinks(await linksForVerse(l.id), { ...filter, books: [], testament: "all", direction: "both" }))));
    return m;
  }, [ring2, ok, ring1.map((l) => l.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const ego = useMemo(() => buildEgo(id, ring1, ring2 ? second.data ?? null : null), [id, ring1, ring2, second.data]);

  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => setSelected(null), [id]);
  const preview = useAsync(() => (selected !== null ? rangeText(tr, selected, selected) : Promise.resolve(null)), [selected, tr]);

  const center = useCallback(
    (to: number) => {
      const r = fromId(to);
      const n = new URLSearchParams(sp);
      n.set("trail", [...trail, id].slice(-5).join(","));
      navigate(`/verse/${BOOKS[r.book].slug}/${r.chapter}/${r.verse}?${n.toString()}`);
    },
    [sp, trail, id, navigate],
  );

  if (!ok) {
    return (
      <Page title="That verse does not exist">
        <Button asChild><Link to="/explore">Back to Explore</Link></Button>
      </Page>
    );
  }
  const ref = formatVerseId(id);
  return (
    <Page wide title={`Connections for ${ref}`} intro={<>Cross references ranked by the votes of OpenBible.info readers. Strength is shown in words and bars.</>}>
      {trail.length > 0 && (
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            {trail.map((t, i) => (
              <span key={`${t}-${i}`} className="contents">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`${connectionsPath(t)}?trail=${trail.slice(0, i).join(",")}`}>{formatVerseId(t, { short: true })}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </span>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>{formatVerseId(id, { short: true })}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <section className="mb-6 max-w-2xl rounded-md border bg-surface p-4" aria-label="The verse">
        <p className="scripture !max-w-none">{text.loading ? <Skeleton className="h-6 w-full" /> : <MarkedText text={text.data ?? ""} />}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{translationById(tr).short}</span>
          <Button asChild size="sm" variant="outline"><Link to={versePath(id)}><BookOpen aria-hidden="true" /> Read in context</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to={`/path?a=${BOOKS[book].osis}.${ch}.${vs}`}><Compass aria-hidden="true" /> Find a path from here</Link></Button>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <section aria-label="Network" className="min-w-0 lg:order-1">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl">Network</h2>
            <div className="flex items-center gap-2">
              <Switch id="ring2" checked={ring2} onCheckedChange={(v) => setFlag("ring2", v)} />
              <Label htmlFor="ring2">Second ring</Label>
            </div>
          </div>
          {links.loading ? <Skeleton className="h-96 w-full" /> : ego.nodes.length < 2 ? <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">There is nothing to draw with these filters.</p> : (
            <EgoGraph nodes={ego.nodes} edges={ego.edges} selected={selected} onSelect={setSelected} onCenter={center} />
          )}
          <p className="mt-1 text-xs text-muted-foreground">Circles are Old Testament, diamonds are New Testament. Tap a node to preview it, double tap or press Shift and Enter to move there.</p>
          {selected !== null && (
            <div className="mt-3 rounded-md border bg-surface p-3" role="status">
              <p className="font-semibold">{formatRange(selected)}</p>
              <p className="mt-1" style={{ fontFamily: "var(--font-scripture)" }}>{preview.data?.[0]?.[1] ? <MarkedText text={preview.data[0][1]} /> : <Skeleton className="h-5 w-full" />}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => center(selected)}>Move here</Button>
                <Button size="sm" variant="outline" asChild><Link to={versePath(selected)}>Read in context</Link></Button>
              </div>
            </div>
          )}
        </section>

        <section aria-label="Ranked connections" className="min-w-0">
          <h2 className="mb-2 text-xl">Ranked connections</h2>
          <div className="mb-4 rounded-md border p-3">
            <LinkFilterBar value={filter} onChange={setFilter} groupBy={group} onGroupBy={(g) => setFlag("group", g)} />
          </div>
          {links.loading ? <Skeleton className="h-60 w-full" /> : links.error ? <p className="text-destructive" role="alert">Could not load cross references. Check your connection and try again.</p> : <ConnectionsList links={links.data ?? []} filter={filter} tr={tr} group={group} />}
        </section>
      </div>
    </Page>
  );
}
