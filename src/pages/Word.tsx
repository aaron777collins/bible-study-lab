import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LexCard } from "@/components/words/LexCard";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS } from "@/lib/canon/books";
import { bookOfId, fromId } from "@/lib/canon/canon";
import { formatVerseId } from "@/lib/canon/parse";
import { decodeDeltas, loadKjvTokens, loadLex, loadOcc, STRONG_RE, strongsLanguage } from "@/lib/data/strongs";
import { versePath } from "@/lib/nav";

function WordVerse({ id, num }: { id: number; num: string }) {
  const r = fromId(id);
  const toks = useAsync(() => loadKjvTokens(r.book), [r.book]);
  const verse = toks.data?.c[r.chapter - 1]?.[r.verse - 1];
  return (
    <li className="border-b py-2.5 last:border-0">
      <Link to={versePath(id)} className="font-semibold">{formatVerseId(id)}</Link>
      <p className="scripture !max-w-none text-[1.0625rem]">
        {verse ? verse.map((t, i) => (typeof t === "string" ? <span key={i}>{t.replace(/[-]/g, "")}</span> : <span key={i} style={t[1] === num ? { background: "var(--hl-gold)", borderRadius: 2, padding: "0 2px" } : undefined}>{t[0]}</span>)) : <Skeleton className="h-5 w-full" />}
      </p>
    </li>
  );
}

export function Component() {
  const { strongs = "" } = useParams();
  const num = strongs.toUpperCase();
  const valid = STRONG_RE.test(num);
  const lex = useAsync(() => (valid ? loadLex(num) : Promise.resolve(undefined)), [num, valid]);
  const occ = useAsync(() => (valid ? loadOcc(num) : Promise.resolve(undefined)), [num, valid]);
  const [shown, setShown] = useState(25);
  useDocumentTitle(valid ? `Word study ${num}` : "Word study");
  const ids = useMemo(() => (occ.data ? decodeDeltas(occ.data.v) : []), [occ.data]);
  const byBook = useMemo(() => {
    const m = new Map<number, number>();
    for (const id of ids) m.set(bookOfId(id), (m.get(bookOfId(id)) ?? 0) + 1);
    return m;
  }, [ids]);
  if (!valid || (!lex.loading && !lex.data)) {
    return (
      <Page title="Word not found" intro="Strong's numbers look like G26 for Greek or H430 for Hebrew."><Button asChild><Link to="/word/G26">See G26, agape</Link></Button></Page>
    );
  }
  const maxBook = Math.max(1, ...byBook.values());
  const label = lex.data ? lex.data[1] || num : num;
  return (
    <Page wide title={`${strongsLanguage(num)} word ${num}: ${label}`} intro="Strong's numbers are tagged to the KJV. Other translations do not have reliable tags here.">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="grid content-start gap-6">
          <LexCard num={num} />
          {occ.data && occ.data.r.length > 0 && (
            <section aria-label="How the KJV renders it">
              <h2 className="mb-2 text-lg">How the KJV renders it</h2>
              <ul className="grid gap-1">
                {occ.data.r.map(([w, n]) => (
                  <li key={w} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2 text-sm">
                    <span>{w}</span>
                    <span className="h-2.5 rounded-sm" style={{ width: `${(n / occ.data!.r[0][1]) * 100}%`, background: "var(--lapis)", opacity: 0.8 }} aria-hidden="true" />
                    <span className="text-right tabular text-muted-foreground">{n}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div>
          {occ.loading ? <Skeleton className="h-72 w-full" /> : (
            <>
              <section aria-label="Where it appears" className="mb-8">
                <h2 className="mb-2 text-lg">Where it appears</h2>
                <div className="flex h-24 items-end gap-px" role="group" aria-label="Occurrences in each book">
                  {BOOKS.map((b, i) => {
                    const n = byBook.get(i) ?? 0;
                    return <span key={b.osis} title={`${b.name}: ${n}`} role="img" aria-label={`${b.name}: ${n}`} className="flex-1" style={{ height: n ? `${Math.max(6, (n / maxBook) * 100)}%` : 2, background: n ? (b.testament === "ot" ? "var(--gilt)" : "var(--lapis)") : "var(--rule)", borderRadius: "2px 2px 0 0" }} />;
                  })}
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>Genesis</span><span>Matthew</span><span>Revelation</span></div>
                <details className="mt-2"><summary className="cursor-pointer text-sm">Show as a list</summary><ul className="mt-2 grid grid-cols-2 gap-x-6 text-sm sm:grid-cols-3">{[...byBook].sort((a, b) => b[1] - a[1]).map(([b, n]) => <li key={b}>{BOOKS[b].name} {n}</li>)}</ul></details>
              </section>
              <section aria-label="Verses">
                <h2 className="mb-2 text-lg">{ids.length.toLocaleString()} {ids.length === 1 ? "verse" : "verses"}</h2>
                <ul>{ids.slice(0, shown).map((id) => <WordVerse key={id} id={id} num={num} />)}</ul>
                {ids.length > shown && <Button variant="outline" className="mt-3" onClick={() => setShown((s) => s + 25)}>Show more</Button>}
              </section>
            </>
          )}
        </div>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Dictionary entries come from Strong&rsquo;s Exhaustive Concordance as prepared by Open Scriptures, licensed CC BY-SA.</p>
    </Page>
  );
}
