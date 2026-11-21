import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkedText } from "@/components/VerseText";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatRange } from "@/lib/canon/parse";
import { rangeText } from "@/lib/data/text";
import { versePath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { decodeCollection } from "@/lib/share/collection";
import { saveCollection } from "@/lib/store/repo";
import { translationById } from "@/lib/translations";

export function Component() {
  const { payload = "" } = useParams();
  const tr = usePrefs((s) => s.translation);
  const col = useAsync(() => decodeCollection(payload), [payload]);
  const texts = useAsync(() => (col.data ? Promise.all(col.data.refs.map(([a, b]) => rangeText(tr, a, b, 30))) : Promise.resolve([])), [col.data, tr]);
  useDocumentTitle(col.data?.title ?? "Shared collection");
  if (col.loading) return <Page title="Opening the collection"><Skeleton className="h-40 w-full" /></Page>;
  if (!col.data) {
    return (
      <Page title="This link did not open" intro="The shared collection could not be read. The link may be cut off. Ask the person who sent it to share it again.">
        <Button asChild><Link to="/">Go to Today</Link></Button>
      </Page>
    );
  }
  const c = col.data;
  return (
    <Page title={c.title} intro={c.description || `${c.refs.length} ${c.refs.length === 1 ? "passage" : "passages"} shared with you. Text shown in the ${translationById(tr).short}.`}>
      <Button className="mb-6" onClick={async () => { const s = await saveCollection({ title: c.title, refs: c.refs, description: c.description }); if (s) toast.success("Saved to your collections"); else toast.error("Notes cannot be saved in this window."); }}>
        <FolderPlus aria-hidden="true" /> Save to my collections
      </Button>
      <ol className="grid gap-4">
        {c.refs.map(([a, b], i) => (
          <li key={i} className="rounded-xl border bg-surface p-4">
            <Link to={versePath(a)} className="font-semibold">{formatRange(a, b > a ? b : 0)}</Link>
            <p className="scripture mt-1 !max-w-none">{texts.data?.[i] ? texts.data[i].map(([id, t]) => <span key={id}><MarkedText text={t} /> </span>) : <Skeleton className="h-6 w-full" />}</p>
          </li>
        ))}
      </ol>
    </Page>
  );
}
