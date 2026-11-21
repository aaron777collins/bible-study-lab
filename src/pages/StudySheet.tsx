import { Link, useParams, useSearchParams } from "react-router";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkedText } from "@/components/VerseText";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { bookIndexFromSlug } from "@/lib/canon/books";
import { isValidRef, toId } from "@/lib/canon/canon";
import { formatRange } from "@/lib/canon/parse";
import { rangeText, verseText } from "@/lib/data/text";
import { parseVerseParam } from "@/lib/reader";
import { useStoreQuery } from "@/lib/store/hooks";
import { notesForRange } from "@/lib/store/repo";
import { isTranslationId, translationById } from "@/lib/translations";
import { usePrefs } from "@/lib/prefs";
import { linksForVerses } from "@/lib/xref/links";
import { verseCount } from "@/lib/canon/canon";

function RefLine({ id, end, tr, votes }: { id: number; end: number; tr: string; votes: number }) {
  const t = useAsync(() => (end ? rangeText(tr, id, Math.min(end, id + 2), 3).then((r) => r.map((x) => x[1]).join(" ")) : verseText(tr, id)), [id, end, tr]);
  return <li className="mb-1.5"><strong>{formatRange(id, end)}</strong> <span className="text-sm">({votes})</span> <span className="scripture !text-[0.95rem]"><MarkedText text={t.data ?? ""} /></span></li>;
}

/** A page to print: the passage, its strongest cross references, the person's notes, and room to write. */
export function Component() {
  const p = useParams();
  const [sp] = useSearchParams();
  const prefTr = usePrefs((s) => s.translation);
  const tr = isTranslationId(sp.get("t") ?? "") ? sp.get("t")! : prefTr;
  const book = bookIndexFromSlug(p.book ?? "");
  const ch = Number(p.chapter);
  const ok = book >= 0 && ch >= 1 && isValidRef(book, ch, 1);
  const sel = ok ? parseVerseParam(sp.get("v"), verseCount(book, ch)) ?? [1, verseCount(book, ch)] : [1, 1];
  const start = ok ? toId(book, ch, sel[0]) : 0;
  const end = ok ? toId(book, ch, sel[1]) : 0;
  const ids = Array.from({ length: Math.min(12, end - start + 1) }, (_, i) => start + i);
  const text = useAsync(() => (ok ? rangeText(tr, start, end, 60) : Promise.resolve([])), [start, end, tr, ok]);
  const links = useAsync(() => (ok ? linksForVerses(ids) : Promise.resolve([])), [start, end, ok]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: notes } = useStoreQuery(() => (ok ? notesForRange(start, end) : Promise.resolve([])), [], [start, end]);
  const ref = ok ? formatRange(start, end > start ? end : 0) : "";
  useDocumentTitle(ok ? `Study sheet: ${ref}` : "Study sheet");
  if (!ok) return <Page title="Passage not found"><Button asChild><Link to="/read/john/1">Read John 1</Link></Button></Page>;
  const top = (links.data ?? []).filter((l) => l.votes > 0).slice(0, 8);
  const lines = (n: number) => Array.from({ length: n }, (_, i) => <div key={i} className="border-b border-black/30 py-3" aria-hidden="true" />);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => window.print()}><Printer aria-hidden="true" /> Print this sheet</Button>
        <Button asChild variant="ghost"><Link to={`/read/${p.book}/${ch}?v=${sel[0]}${sel[1] > sel[0] ? `-${sel[1]}` : ""}`}>Back to reading</Link></Button>
      </div>
      <h1 className="text-2xl">Study sheet: {ref}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{translationById(tr).name}</p>
      <section aria-label="Passage" className="mb-5">
        <h2 className="mb-1 text-lg">The passage</h2>
        <div className="scripture !max-w-none">{text.data?.map(([id, t], i) => <span key={id}><sup className="mr-0.5 text-xs text-lapis">{sel[0] + i}</sup><MarkedText text={t} /> </span>)}</div>
      </section>
      {top.length > 0 && (
        <section aria-label="Cross references" className="mb-5">
          <h2 className="mb-1 text-lg">Where else it is echoed</h2>
          <ul className="list-none">{top.map((l) => <RefLine key={l.id} id={l.id} end={l.end} tr={tr} votes={l.votes} />)}</ul>
        </section>
      )}
      {notes.length > 0 && (
        <section aria-label="My notes" className="mb-5">
          <h2 className="mb-1 text-lg">My notes</h2>
          {notes.map((n) => <p key={n.id} className="mb-1 whitespace-pre-wrap">{n.body}</p>)}
        </section>
      )}
      <section aria-label="Observe, interpret, apply" className="grid gap-4">
        {(["Observe: what does it say?", "Interpret: what does it mean?", "Apply: what will I do about it?"] as const).map((h) => (
          <div key={h}><h2 className="text-lg">{h}</h2>{lines(4)}</div>
        ))}
      </section>
      <p className="mt-6 text-xs text-muted-foreground">Bible Study Lab. Cross references from OpenBible.info (CC BY 4.0).</p>
    </div>
  );
}
