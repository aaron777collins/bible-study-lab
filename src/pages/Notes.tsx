import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Bookmark as BookmarkIcon, FolderOpen, Link2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkedText } from "@/components/VerseText";
import { NotesBanner } from "@/components/NotesBanner";
import { BackupPanel } from "@/components/notes/BackupPanel";
import { NoteCard } from "@/components/notes/NoteCard";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatRange } from "@/lib/canon/parse";
import { rangeText, verseText } from "@/lib/data/text";
import { versePath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { buildShareLink, SHARE_LIMIT } from "@/lib/share/collection";
import { appUrl, copyText } from "@/lib/share/format";
import { useStoreQuery } from "@/lib/store/hooks";
import { listBookmarks, listCollections, listHighlights, listNotes, restore, saveCollection, softDelete } from "@/lib/store/repo";
import { HIGHLIGHT_LABEL, type Collection, type HighlightColor } from "@/lib/store/types";

function HighlightRow({ id, color }: { id: number; color: HighlightColor }) {
  const tr = usePrefs((s) => s.translation);
  const t = useAsync(() => verseText(tr, id), [id, tr]);
  return (
    <li className="rounded-md border bg-surface p-3">
      <Link to={versePath(id)} className="font-semibold">{formatRange(id)}</Link>
      <p className="mt-1" style={{ fontFamily: "var(--font-scripture)" }}><span className="hl-mark" data-c={color} aria-hidden="true" /> <span className="rounded-sm px-1" style={{ background: `var(--hl-${color})` }}>{t.data ? <MarkedText text={t.data} /> : "..."}</span> <span className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-ui)" }}>{HIGHLIGHT_LABEL[color]}</span></p>
    </li>
  );
}

function CollectionCard({ c }: { c: Collection }) {
  const [title, setTitle] = useState(c.title);
  const [desc, setDesc] = useState(c.description);
  const tr = usePrefs((s) => s.translation);
  const texts = useAsync(() => Promise.all(c.refs.map(([a, b]) => rangeText(tr, a, b, 8))), [c.id, c.refs.length, tr]);
  const share = async () => {
    const link = await buildShareLink({ title, description: desc, refs: c.refs });
    if (link.ok) {
      if (await copyText(appUrl(link.path))) toast.success("Link copied. Anyone with it can open this collection.");
    } else toast.error(`This collection is too long for a link (${link.length} characters, the limit is ${SHARE_LIMIT}). Remove a passage or two.`);
  };
  return (
    <li className="rounded-xl border bg-surface p-4">
      <div className="grid gap-2">
        <Label htmlFor={`ct-${c.id}`} className="sr-only">Collection title</Label>
        <Input id={`ct-${c.id}`} value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title !== c.title && saveCollection({ id: c.id, title, refs: c.refs, description: desc })} className="text-lg font-semibold" />
        <Label htmlFor={`cd-${c.id}`} className="sr-only">Short note for the group</Label>
        <Input id={`cd-${c.id}`} value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== c.description && saveCollection({ id: c.id, title, refs: c.refs, description: desc })} placeholder="A short note for your group (optional)" />
      </div>
      <ol className="mt-3 grid gap-2">
        {c.refs.map(([a, b], i) => (
          <li key={i} className="flex items-start justify-between gap-2 border-t pt-2">
            <div className="min-w-0">
              <Link to={versePath(a)} className="font-semibold">{formatRange(a, b > a ? b : 0)}</Link>
              <p className="line-clamp-2 text-sm text-muted-foreground">{texts.data?.[i]?.map(([, t]) => t.replace(/[-]/g, "")).join(" ")}</p>
            </div>
            <Button size="icon-sm" variant="ghost" aria-label={`Remove ${formatRange(a, b > a ? b : 0)}`} onClick={() => saveCollection({ id: c.id, title, refs: c.refs.filter((_, k) => k !== i), description: desc })}><Trash2 aria-hidden="true" /></Button>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={share} disabled={!c.refs.length}><Link2 aria-hidden="true" /> Copy share link</Button>
        <Button size="sm" variant="ghost" onClick={async () => { await softDelete("collections", c.id); toast("Collection deleted", { action: { label: "Undo", onClick: () => restore("collections", c.id) } }); }}><Trash2 aria-hidden="true" /> Delete</Button>
      </div>
    </li>
  );
}

export function Component() {
  useDocumentTitle("My notes");
  const [sp, setSp] = useSearchParams();
  const tab = ["notes", "prayers", "highlights", "bookmarks", "collections", "backup"].includes(sp.get("tab") ?? "") ? sp.get("tab")! : "notes";
  const { data: notes } = useStoreQuery(listNotes, []);
  const { data: highlights } = useStoreQuery(listHighlights, []);
  const { data: bookmarks } = useStoreQuery(listBookmarks, []);
  const { data: collections } = useStoreQuery(listCollections, []);
  const [filter, setFilter] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].sort(), [notes]);
  const f = filter.trim().toLowerCase();
  const match = (n: (typeof notes)[number]) => (!tag || n.tags.includes(tag)) && (!f || n.body.toLowerCase().includes(f) || formatRange(n.start, n.end).toLowerCase().includes(f) || n.tags.some((t) => t.includes(f)));
  const plainNotes = notes.filter((n) => n.kind !== "prayer" && match(n));
  const prayers = notes.filter((n) => n.kind === "prayer" && match(n));
  const open = prayers.filter((n) => !n.answeredAt);
  const answered = prayers.filter((n) => n.answeredAt);

  return (
    <Page wide title="My notes" intro="Notes, prayers, highlights, bookmarks and collections. They are saved only in this browser, so export a copy now and then.">
      <NotesBanner className="mb-6 max-w-3xl" />
      <Tabs value={tab} onValueChange={(v) => setSp(new URLSearchParams({ tab: v }), { replace: true })}>
        <TabsList className="h-auto w-full flex-wrap justify-start bg-wash">
          <TabsTrigger value="notes" className="py-2.5">Notes {plainNotes.length || ""}</TabsTrigger>
          <TabsTrigger value="prayers" className="py-2.5">Prayers {prayers.length || ""}</TabsTrigger>
          <TabsTrigger value="highlights" className="py-2.5">Highlights {highlights.length || ""}</TabsTrigger>
          <TabsTrigger value="bookmarks" className="py-2.5">Bookmarks {bookmarks.length || ""}</TabsTrigger>
          <TabsTrigger value="collections" className="py-2.5">Collections {collections.length || ""}</TabsTrigger>
          <TabsTrigger value="backup" className="py-2.5">Back up</TabsTrigger>
        </TabsList>

        {(tab === "notes" || tab === "prayers") && (
          <div className="mt-4 max-w-3xl">
            <Label htmlFor="nfilter" className="sr-only">Filter notes</Label>
            <Input id="nfilter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by word, verse or tag" className="max-w-sm" />
            {tags.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tags">
                {tags.map((t) => (
                  <li key={t}><button type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}><Badge variant={tag === t ? "default" : "outline"}>#{t}</Badge></button></li>
                ))}
              </ul>
            )}
          </div>
        )}

        <TabsContent value="notes" className="mt-4 max-w-3xl">
          {plainNotes.length === 0 ? <p className="rounded-md border border-dashed p-4 text-muted-foreground">No notes yet. Tap a verse, then Note.</p> : <ul className="grid gap-3">{plainNotes.map((n) => <li key={n.id}><NoteCard note={n} /></li>)}</ul>}
        </TabsContent>
        <TabsContent value="prayers" className="mt-4 max-w-3xl">
          {prayers.length === 0 ? <p className="rounded-md border border-dashed p-4 text-muted-foreground">No prayers yet. Tap a verse, choose Note, then pick Prayer. Mark it answered later and look back on what God has done.</p> : (
            <>
              <h2 className="mb-2 text-lg">Praying</h2>
              <ul className="mb-6 grid gap-3">{open.map((n) => <li key={n.id}><NoteCard note={n} /></li>)}</ul>
              {answered.length > 0 && <><h2 className="mb-2 text-lg">Answered</h2><ul className="grid gap-3">{answered.map((n) => <li key={n.id}><NoteCard note={n} /></li>)}</ul></>}
            </>
          )}
        </TabsContent>
        <TabsContent value="highlights" className="mt-4 max-w-3xl">
          {highlights.length === 0 ? <p className="rounded-md border border-dashed p-4 text-muted-foreground">No highlights yet. Tap a verse, open Notes, and choose a color.</p> : <ul className="grid gap-2">{highlights.map((h) => <HighlightRow key={h.verseId} id={h.verseId} color={h.color} />)}</ul>}
        </TabsContent>
        <TabsContent value="bookmarks" className="mt-4 max-w-3xl">
          {bookmarks.length === 0 ? <p className="rounded-md border border-dashed p-4 text-muted-foreground">No bookmarks yet. Tap a verse, then the bookmark icon.</p> : (
            <ul className="grid gap-2">
              {bookmarks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 rounded-md border bg-surface px-3 py-2.5">
                  <Link to={versePath(b.start)} className="inline-flex items-center gap-2 font-semibold"><BookmarkIcon className="size-4 text-lapis" aria-hidden="true" /> {formatRange(b.start, b.end > b.start ? b.end : 0)}</Link>
                  <Button size="icon-sm" variant="ghost" aria-label="Remove bookmark" onClick={async () => { await softDelete("bookmarks", b.id); toast("Bookmark removed", { action: { label: "Undo", onClick: () => restore("bookmarks", b.id) } }); }}><Trash2 aria-hidden="true" /></Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="collections" className="mt-4 max-w-3xl">
          <p className="mb-3 text-muted-foreground">A collection is a list of passages you can send as one link, for example the readings for a week of a small group. Add passages from the Share tab in the reader.</p>
          {collections.length === 0 ? <p className="rounded-md border border-dashed p-4"><FolderOpen className="mr-2 inline size-4" aria-hidden="true" />No collections yet.</p> : <ul className="grid gap-4">{collections.map((c) => <CollectionCard key={c.id} c={c} />)}</ul>}
        </TabsContent>
        <TabsContent value="backup" className="mt-4 max-w-3xl"><BackupPanel /></TabsContent>
      </Tabs>
    </Page>
  );
}
