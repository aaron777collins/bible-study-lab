import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { loadTopicIndex, STARTER_TOPICS } from "@/lib/topics";

export function Component() {
  useDocumentTitle("Topics");
  const idx = useAsync(loadTopicIndex, []);
  const [q, setQ] = useState("");
  const bySlug = useMemo(() => new Map((idx.data ?? []).map((r) => [r[1], r])), [idx.data]);
  const needle = q.trim().toLowerCase();
  const matches = useMemo(() => (needle && idx.data ? idx.data.filter((r) => r[0].toLowerCase().includes(needle)).sort((a, b) => (a[0].toLowerCase().startsWith(needle) ? 0 : 1) - (b[0].toLowerCase().startsWith(needle) ? 0 : 1) || b[2] - a[2]).slice(0, 120) : []), [needle, idx.data]);
  return (
    <Page title="Topics" intro={<>Verses gathered by subject, ranked by how readers voted. Search {idx.data ? idx.data.length.toLocaleString() : "thousands of"} topics or start with a common one. Topics come from OpenBible.info.</>}>
      <div className="mb-6 grid max-w-md gap-1.5">
        <Label htmlFor="tq">Search topics</Label>
        <Input id="tq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="anxiety, courage, sabbath" autoComplete="off" />
      </div>
      {idx.loading ? (
        <Skeleton className="h-48 w-full" />
      ) : needle ? (
        matches.length === 0 ? (
          <p className="rounded-md border border-dashed p-4">No topics match &ldquo;{q}&rdquo;. Try a shorter or simpler word.</p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Matching topics">
            {matches.map((r) => <li key={r[1]}><Link to={`/topics/${r[1]}`} className="inline-block rounded-full border bg-surface px-3 py-1.5 text-sm no-underline hover:bg-accent">{r[0]} <span className="text-muted-foreground">{r[2]}</span></Link></li>)}
          </ul>
        )
      ) : (
        <>
          <h2 className="mb-3 text-xl">Common topics</h2>
          <ul className="flex flex-wrap gap-2">
            {STARTER_TOPICS.filter((s) => bySlug.has(s)).map((s) => <li key={s}><Link to={`/topics/${s}`} className="inline-block rounded-full border bg-surface px-4 py-2 no-underline hover:bg-accent">{bySlug.get(s)![0]}</Link></li>)}
          </ul>
        </>
      )}
    </Page>
  );
}
