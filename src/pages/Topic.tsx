import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkedText } from "@/components/VerseText";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatRange } from "@/lib/canon/parse";
import { rangeText } from "@/lib/data/text";
import { connectionsPath, versePath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { loadTopicIndex, loadTopicPassages } from "@/lib/topics";

function Passage({ start, end, score, max, tr }: { start: number; end: number; score: number; max: number; tr: string }) {
  const t = useAsync(() => rangeText(tr, start, end || start, 6), [start, end, tr]);
  return (
    <li className="border-b py-3 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link to={versePath(start)} className="font-semibold">{formatRange(start, end)}</Link>
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-1.5 w-14 overflow-hidden rounded-full bg-wash" aria-hidden="true"><span className="block h-full rounded-full" style={{ width: `${(score / max) * 100}%`, background: "var(--gilt)" }} /></span>score {score}</span>
      </div>
      <p className="mt-1" style={{ fontFamily: "var(--font-scripture)" }}>{t.data ? t.data.map(([id, v]) => <span key={id}><MarkedText text={v} /> </span>) : <Skeleton className="h-5 w-full" />}</p>
      <Link to={connectionsPath(start)} className="text-sm">Connections from here</Link>
    </li>
  );
}

export function Component() {
  const { slug = "" } = useParams();
  const tr = usePrefs((s) => s.translation);
  const idx = useAsync(loadTopicIndex, []);
  const name = idx.data?.find((r) => r[1] === slug)?.[0];
  const passages = useAsync(() => loadTopicPassages(slug), [slug]);
  const [shown, setShown] = useState(20);
  useDocumentTitle(name ? `Topic: ${name}` : "Topic");
  if (passages.data && passages.data.length === 0) return <Page title="Topic not found" intro="There is no topic with that name."><Button asChild><Link to="/topics">All topics</Link></Button></Page>;
  const max = Math.max(1, ...(passages.data ?? []).map((p) => p[2]));
  return (
    <Page title={name ?? "Topic"} intro={passages.data ? `${passages.data.length} passages, best scoring first.` : undefined}>
      <p className="mb-4"><Link to="/topics">All topics</Link></p>
      {passages.loading ? <Skeleton className="h-60 w-full" /> : (
        <>
          <ul>{(passages.data ?? []).slice(0, shown).map((p) => <Passage key={`${p[0]}-${p[1]}`} start={p[0]} end={p[1]} score={p[2]} max={max} tr={tr} />)}</ul>
          {(passages.data?.length ?? 0) > shown && <Button variant="outline" className="mt-3" onClick={() => setShown((s) => s + 20)}>Show more</Button>}
        </>
      )}
      <p className="mt-6 text-sm text-muted-foreground">Topic scores from OpenBible.info, licensed CC BY 4.0.</p>
    </Page>
  );
}
