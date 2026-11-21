import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkedText } from "@/components/VerseText";
import { BOOKS } from "@/lib/canon/books";
import { bookOfId, fromId } from "@/lib/canon/canon";
import { formatRange } from "@/lib/canon/parse";
import { rangeText, plain } from "@/lib/data/text";
import { connectionsPath, versePath } from "@/lib/nav";
import { filterLinks, strengthFraction, TIER_LABEL, tierOf, type LinkFilter, type XLink } from "@/lib/xref/links";
import { useAsync } from "@/hooks/useAsync";

const TIER_COLOR: Record<string, string> = { strong: "var(--gilt)", medium: "var(--lapis)", light: "var(--ink-muted)", disputed: "var(--danger)" };

export function StrengthBar({ votes, top }: { votes: number; top: number }) {
  const tier = tierOf(votes);
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${TIER_LABEL[tier]}, ${votes} votes`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-wash" aria-hidden="true">
        <div className="h-full rounded-full" style={{ width: `${strengthFraction(votes, top) * 100}%`, background: TIER_COLOR[tier] }} />
      </div>
      <span className="text-xs font-medium" style={{ color: tier === "strong" ? "var(--ink)" : "var(--ink-muted)" }}>
        {TIER_LABEL[tier]} <span className="tabular">{votes}</span>
      </span>
    </div>
  );
}

function Preview({ tr, link }: { tr: string; link: XLink }) {
  const last = link.end && link.end - link.id < 40 ? link.end : link.id;
  const { data } = useAsync(() => rangeText(tr, link.id, Math.min(last, link.id + 2), 3), [tr, link.id, link.end]);
  if (!data) return <Skeleton className="mt-1 h-4 w-full" />;
  const more = last - link.id + 1 - 1;
  const text = data.map(([, t]) => plain(t)).join(" ").trim();
  return (
    <p className="mt-1 line-clamp-3 text-[0.9375rem] text-foreground" style={{ fontFamily: "var(--font-scripture)" }}>
      {text || <em className="text-muted-foreground">Not in this translation.</em>}
      {more > 2 && <span className="text-muted-foreground"> and {more - 2} more verses</span>}
    </p>
  );
}

export function XrefRow({ link, top, tr, onOpen, trailQuery = "" }: { link: XLink; top: number; tr: string; onOpen?: () => void; trailQuery?: string }) {
  const label = formatRange(link.id, link.end);
  const dirText = link.dir === "both" ? "Links both ways" : link.dir === "in" ? "Referenced by" : "";
  return (
    <li className="border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Link to={versePath(link.id)} onClick={onOpen} className="font-semibold">{label}</Link>
        <StrengthBar votes={link.votes} top={top} />
      </div>
      <Preview tr={tr} link={link} />
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        {dirText && <span>{dirText}</span>}
        <Link to={connectionsPath(link.id, trailQuery)} onClick={onOpen} className="inline-flex items-center gap-1">
          <Compass className="size-3.5" aria-hidden="true" /> Connections from here
        </Link>
      </div>
    </li>
  );
}

export function ConnectionsList({ links, filter, tr, group = false, pageSize = 25, onOpen, emptyText, trailQuery }: { links: XLink[]; filter: LinkFilter; tr: string; group?: boolean; pageSize?: number; onOpen?: () => void; emptyText?: string; trailQuery?: string }) {
  const [shown, setShown] = useState(pageSize);
  const filtered = useMemo(() => filterLinks(links, filter), [links, filter]);
  const top = useMemo(() => Math.max(1, ...links.map((l) => l.votes)), [links]);
  useEffect(() => setShown(pageSize), [links, filter, pageSize]);

  if (!filtered.length) {
    return <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{emptyText ?? (links.length ? "No links match these filters. Try a lower strength." : "No cross references for this verse.")}</p>;
  }
  if (group) {
    const byBook = new Map<number, XLink[]>();
    for (const l of filtered) {
      const b = bookOfId(l.id);
      byBook.set(b, [...(byBook.get(b) ?? []), l]);
    }
    const entries = [...byBook].sort((a, b) => b[1].length - a[1].length || a[0] - b[0]);
    return (
      <div>
        {entries.map(([b, ls]) => (
          <section key={b} aria-label={BOOKS[b].name} className="mb-4">
            <h3 className="mb-1 text-base">{BOOKS[b].name} <span className="text-sm font-normal text-muted-foreground">{ls.length} {ls.length === 1 ? "link" : "links"}</span></h3>
            <ul>{ls.slice(0, 10).map((l) => <XrefRow key={`${l.id}-${l.end}`} link={l} top={top} tr={tr} onOpen={onOpen} trailQuery={trailQuery} />)}</ul>
            {ls.length > 10 && <p className="text-xs text-muted-foreground">and {ls.length - 10} more in {BOOKS[b].name}. Use the book filter to see them.</p>}
          </section>
        ))}
      </div>
    );
  }
  return (
    <div>
      <p className="mb-1 text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "link" : "links"}{filtered.length !== links.length ? ` of ${links.length}` : ""}, strongest first
      </p>
      <ul>
        {filtered.slice(0, shown).map((l) => (
          <XrefRow key={`${l.id}-${l.end}`} link={l} top={top} tr={tr} onOpen={onOpen} trailQuery={trailQuery} />
        ))}
      </ul>
      {filtered.length > shown && (
        <Button variant="outline" className="mt-3 w-full" onClick={() => setShown((s) => s + pageSize)}>
          Show {Math.min(pageSize, filtered.length - shown)} more
        </Button>
      )}
    </div>
  );
}

export { fromId, MarkedText };
