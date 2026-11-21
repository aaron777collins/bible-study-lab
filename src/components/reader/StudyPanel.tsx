import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HighlightPicker } from "@/components/notes/HighlightPicker";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteForm } from "@/components/notes/NoteForm";
import { SharePanel } from "@/components/share/SharePanel";
import { WordsPanel } from "@/components/words/WordsPanel";
import { ConnectionsList } from "@/components/xref/ConnectionsList";
import { LinkFilterBar } from "@/components/xref/LinkFilterBar";
import { useAsync } from "@/hooks/useAsync";
import { fromId } from "@/lib/canon/canon";
import { formatRange } from "@/lib/canon/parse";
import { connectionsPath } from "@/lib/nav";
import { useStoreQuery } from "@/lib/store/hooks";
import { addBookmark, highlightsInRange, listBookmarks, notesForRange, softDelete, restore } from "@/lib/store/repo";
import { DEFAULT_FILTER, linksForVerses, type LinkFilter } from "@/lib/xref/links";

export type PanelTab = "xref" | "notes" | "words" | "share";

export function StudyPanel({ start, end, tr, tab, onTab, shareQuery, activeStrong, onStrong, onTranslation, onClose }: { start: number; end: number; tr: string; tab: PanelTab; onTab: (t: PanelTab) => void; shareQuery: string; activeStrong: string | null; onStrong: (n: string | null) => void; onTranslation: (t: string) => void; onClose?: () => void }) {
  const ids = useMemo(() => {
    const out: number[] = [];
    for (let id = start; id <= Math.min(end, start + 11); id++) out.push(id);
    return out;
  }, [start, end]);
  const ref = formatRange(start, end > start ? end : 0);
  const links = useAsync(() => linksForVerses(ids), [start, end]);
  const [filter, setFilter] = useState<LinkFilter>(DEFAULT_FILTER);
  const [group, setGroup] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { data: notes } = useStoreQuery(() => notesForRange(start, end), [], [start, end]);
  const { data: hls } = useStoreQuery(() => highlightsInRange(start, end), new Map(), [start, end]);
  const { data: bookmarks } = useStoreQuery(listBookmarks, []);
  const bookmark = bookmarks.find((b) => b.start === start && b.end === end);
  const count = links.data?.length ?? 0;
  const firstHl = hls.get(start);

  return (
    <div className="flex h-full flex-col" data-testid="study-panel">
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 className="text-lg">{ref}</h2>
          <p className="text-sm text-muted-foreground">{count ? `${count} connected ${count === 1 ? "passage" : "passages"}` : links.loading ? "Looking for connections" : "No cross references"}</p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={bookmark ? "Remove bookmark" : "Bookmark this passage"}
            aria-pressed={!!bookmark}
            onClick={async () => {
              if (bookmark) {
                await softDelete("bookmarks", bookmark.id);
                toast("Bookmark removed", { action: { label: "Undo", onClick: () => restore("bookmarks", bookmark.id) } });
              } else {
                const b = await addBookmark(start, end, ref);
                if (b) toast.success("Bookmarked");
                else toast.error("Notes cannot be saved in this window.");
              }
            }}
          >
            {bookmark ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
          </Button>
          <Button variant="ghost" size="icon-sm" asChild aria-label="Open the connections page for this verse">
            <Link to={connectionsPath(start)}><Compass aria-hidden="true" /></Link>
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
      <Tabs value={tab} onValueChange={(v) => onTab(v as PanelTab)} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-4 mt-3 grid h-auto w-auto grid-cols-4 bg-wash">
          <TabsTrigger value="xref" className="py-2.5">Links{count ? ` ${count}` : ""}</TabsTrigger>
          <TabsTrigger value="notes" className="py-2.5">Notes{notes.length ? ` ${notes.length}` : ""}</TabsTrigger>
          <TabsTrigger value="words" className="py-2.5">Words</TabsTrigger>
          <TabsTrigger value="share" className="py-2.5">Share</TabsTrigger>
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
          <TabsContent value="xref" className="mt-0 grid gap-3">
            <div>
              <Button variant="outline" size="sm" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
                {showFilters ? "Hide filters" : "Filter and group"}
              </Button>
              {showFilters && (
                <div className="mt-3 rounded-md border p-3">
                  <LinkFilterBar value={filter} onChange={setFilter} groupBy={group} onGroupBy={setGroup} compact />
                </div>
              )}
            </div>
            {links.loading ? <Skeleton className="h-40 w-full" /> : links.error ? <p className="text-sm text-destructive">Could not load cross references. Check your connection and try again.</p> : <ConnectionsList links={links.data ?? []} filter={filter} tr={tr} group={group} pageSize={15} />}
          </TabsContent>
          <TabsContent value="notes" className="mt-0 grid gap-4">
            <section aria-label="Highlight">
              <h3 className="mb-2 text-base">Highlight</h3>
              <HighlightPicker ids={ids} current={firstHl} />
            </section>
            <section aria-label="Add a note">
              <h3 className="mb-2 text-base">Add a note</h3>
              <NoteForm start={start} end={end} />
            </section>
            {notes.length > 0 && (
              <section aria-label="Notes on this passage" className="grid gap-2">
                <h3 className="text-base">Notes on this passage</h3>
                {notes.map((n) => <NoteCard key={n.id} note={n} showRef={n.start !== start || n.end !== end} />)}
              </section>
            )}
          </TabsContent>
          <TabsContent value="words" className="mt-0">
            <WordsPanel start={start} end={end} tr={tr} active={activeStrong} onPick={onStrong} onSwitchKjv={() => onTranslation("kjv")} />
          </TabsContent>
          <TabsContent value="share" className="mt-0">
            <SharePanel start={start} end={end} tr={tr} shareQuery={shareQuery} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export { fromId };
