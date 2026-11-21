import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Copy, FolderPlus, Image, Link2, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { fromId } from "@/lib/canon/canon";
import { formatRange } from "@/lib/canon/parse";
import { BOOKS } from "@/lib/canon/books";
import { plain, rangeText } from "@/lib/data/text";
import { appUrl, copyText, COPY_FORMAT_LABEL, formatCopy, type CopyFormat } from "@/lib/share/format";
import { saveCollection, listCollections } from "@/lib/store/repo";
import { useStoreQuery } from "@/lib/store/hooks";
import { translationById } from "@/lib/translations";
import { VerseCardDialog } from "./VerseCardDialog";

export function SharePanel({ start, end, tr, shareQuery }: { start: number; end: number; tr: string; shareQuery: string }) {
  const [cardOpen, setCardOpen] = useState(false);
  const verses = useAsync(() => rangeText(tr, start, end, 60), [tr, start, end]);
  const { data: collections } = useStoreQuery(listCollections, []);
  const ref = formatRange(start, end > start ? end : 0);
  const r = fromId(start);
  const path = `/read/${BOOKS[r.book].slug}/${r.chapter}${shareQuery}`;

  const copy = async (f: CopyFormat) => {
    if (!verses.data) return;
    const ok = await copyText(formatCopy({ start, end, tr, verses: verses.data }, f));
    if (ok) toast.success(`Copied ${ref}`);
    else toast.error("Could not copy. Select the text and copy it by hand.");
  };
  const shareLink = async () => {
    const url = appUrl(path);
    if (navigator.share) {
      try {
        await navigator.share({ title: ref, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    if (await copyText(url)) toast.success("Link copied");
  };
  const addToCollection = async (id?: string) => {
    const existing = collections.find((c) => c.id === id);
    const saved = await saveCollection({ id, title: existing?.title ?? `Study ${new Date().toLocaleDateString()}`, refs: [...(existing?.refs ?? []), [start, end]] });
    if (saved) toast.success(`Added to ${saved.title}`);
  };

  const text = verses.data ? verses.data.map(([, t]) => plain(t)).filter(Boolean).join(" ") : "";
  return (
    <div className="grid gap-4">
      <section aria-label="Copy the text">
        <h3 className="mb-2 text-base">Copy the text</h3>
        <div className="grid gap-2">
          {(Object.keys(COPY_FORMAT_LABEL) as CopyFormat[]).map((f) => (
            <Button key={f} variant="outline" className="justify-start" disabled={!verses.data} onClick={() => copy(f)} data-testid={`copy-${f}`}>
              <Copy aria-hidden="true" /> {COPY_FORMAT_LABEL[f]}
            </Button>
          ))}
        </div>
      </section>
      <section aria-label="Share" className="grid gap-2">
        <h3 className="text-base">Share</h3>
        <Button variant="outline" className="justify-start" onClick={shareLink}>
          {typeof navigator !== "undefined" && "share" in navigator ? <Share2 aria-hidden="true" /> : <Link2 aria-hidden="true" />}
          {typeof navigator !== "undefined" && "share" in navigator ? "Share a link" : "Copy a link"}
        </Button>
        <Button variant="outline" className="justify-start" disabled={!text} onClick={() => setCardOpen(true)}>
          <Image aria-hidden="true" /> Make a verse card
        </Button>
        <Button variant="outline" className="justify-start" asChild>
          <Link to={`/sheet/${BOOKS[r.book].slug}/${r.chapter}?v=${fromId(start).verse}${end > start ? `-${fromId(end).verse}` : ""}&t=${tr}`}>
            <Printer aria-hidden="true" /> Printable study sheet
          </Link>
        </Button>
      </section>
      <section aria-label="Collections" className="grid gap-2">
        <h3 className="text-base">Collections</h3>
        <p className="text-sm text-muted-foreground">A collection is a list of passages you can send as one link, such as a week of a small group study.</p>
        <Button variant="outline" className="justify-start" onClick={() => addToCollection()}>
          <FolderPlus aria-hidden="true" /> Start a new collection with this
        </Button>
        {collections.slice(0, 4).map((c) => (
          <Button key={c.id} variant="ghost" className="justify-start" onClick={() => addToCollection(c.id)}>
            <FolderPlus aria-hidden="true" /> Add to {c.title}
          </Button>
        ))}
      </section>
      <VerseCardDialog open={cardOpen} onOpenChange={setCardOpen} text={text} reference={ref} translation={translationById(tr).short} />
    </div>
  );
}
