import { Link, useParams } from "react-router";
import { BookOpen, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS, bookIndexFromSlug } from "@/lib/canon/books";
import { bookVerseCount, chapterCount } from "@/lib/canon/canon";
import { parseRef } from "@/lib/canon/parse";
import { getJson } from "@/lib/data/load";
import { passagePath, readPath } from "@/lib/nav";
import { loadSummary } from "@/lib/xref/links";
import { overviewFor } from "@/content/books";

export function Component() {
  const { book: slug = "" } = useParams();
  const i = bookIndexFromSlug(slug);
  const b = BOOKS[i];
  const o = b ? overviewFor(b.osis) : undefined;
  useDocumentTitle(b ? `${b.name}: overview` : "Book not found");
  const ins = useAsync(() => (b ? getJson<Record<string, { words: number; top: [string, number][]; distinct: [string, number, number][] }>>(`insights/${b.osis}.json`) : Promise.resolve(undefined)), [b?.osis]);
  const sum = useAsync(loadSummary, []);
  if (!b || !o) return <Page title="Book not found"><Button asChild><Link to="/books">All books</Link></Button></Page>;
  const m = sum.data?.matrix;
  const linkedTo = m ? BOOKS.map((x, j) => ({ j, v: j === i ? 0 : m[i * 66 + j] + m[j * 66 + i] })).filter((r) => r.v > 0).sort((a, c) => c.v - a.v).slice(0, 5) : [];
  const words = ins.data?.kjv;
  return (
    <Page title={b.name} intro={<>{b.section}. {chapterCount(i)} {chapterCount(i) === 1 ? "chapter" : "chapters"}, {bookVerseCount(i).toLocaleString()} verses{words ? `, ${words.words.toLocaleString()} words in the KJV` : ""}.</>}>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild><Link to={readPath(i, 1)}><BookOpen aria-hidden="true" /> Read {b.name}</Link></Button>
        <Button asChild variant="outline"><Link to={`/explore/${b.slug}`}><Compass aria-hidden="true" /> See its connections</Link></Button>
      </div>
      <div className="grid max-w-2xl gap-6">
        <section aria-label="Summary"><h2 className="mb-1 text-lg">What it is about</h2><p className="text-[1.0625rem]">{o.summary}</p></section>
        <section aria-label="Author and setting">
          <h2 className="mb-1 text-lg">Author and setting</h2>
          <p>{o.author}</p>
          <p className="mt-2">{o.setting}</p>
        </section>
        <section aria-label="Themes"><h2 className="mb-1 text-lg">Themes</h2><ul className="list-disc space-y-0.5 pl-5">{o.themes.map((t) => <li key={t}>{t}</li>)}</ul></section>
        <section aria-label="Outline">
          <h2 className="mb-1 text-lg">Outline</h2>
          <ol className="grid gap-1">{o.outline.map(([range, label]) => {
            const first = Number(range.split("-")[0]);
            return <li key={range} className="grid grid-cols-[5.5rem_1fr] gap-2"><Link to={readPath(i, first)} className="tabular">{chapterCount(i) === 1 ? "The letter" : `Ch ${range}`}</Link><span>{label}</span></li>;
          })}</ol>
        </section>
        <section aria-label="Key passages">
          <h2 className="mb-1 text-lg">Key passages</h2>
          <ul className="flex flex-wrap gap-2">{o.keyPassages.map((k) => { const r = parseRef(k); return r.ok ? <li key={k}><Button asChild variant="outline" size="sm"><Link to={passagePath(r.passages[0])}>{k}</Link></Button></li> : null; })}</ul>
        </section>
        {sum.loading ? <Skeleton className="h-20 w-full" /> : linkedTo.length > 0 && (
          <section aria-label="Most connected books">
            <h2 className="mb-1 text-lg">Books it connects with most</h2>
            <p className="flex flex-wrap gap-x-4 gap-y-1">{linkedTo.map((r) => <Link key={r.j} to={`/explore/${BOOKS[r.j].slug}`}>{BOOKS[r.j].name}</Link>)}</p>
          </section>
        )}
        {words && (
          <section aria-label="Words">
            <h2 className="mb-1 text-lg">Words it leans on</h2>
            <p className="flex flex-wrap gap-x-4 gap-y-1">{words.distinct.slice(0, 12).map(([w]) => <Link key={w} to={`/search?q=${encodeURIComponent(w)}&scope=${b.osis}`}>{w}</Link>)}</p>
          </section>
        )}
      </div>
      <p className="mt-8 max-w-2xl text-sm text-muted-foreground">These overviews were written for this app in plain words and aim to be fair to different traditions. They are a starting point. The text of Scripture is the best teacher.</p>
    </Page>
  );
}
