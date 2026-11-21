import { useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { Copy, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRange } from "@/lib/canon/parse";
import { copyText } from "@/lib/share/format";
import { downloadBackup, importBackup, validateBackup } from "@/lib/store/backup";
import { listNotes } from "@/lib/store/repo";
import type { BackupFile } from "@/lib/store/types";
import { useMeta } from "@/lib/store/hooks";
import { plain, rangeText } from "@/lib/data/text";

const countText = (c: BackupFile["counts"]) =>
  [
    [c.notes, "note"],
    [c.highlights, "highlight"],
    [c.bookmarks, "bookmark"],
    [c.collections, "collection"],
    [c.memory, "memory verse"],
    [c.planProgress, "plan day"],
  ]
    .filter(([n]) => (n as number) > 0)
    .map(([n, w]) => `${n} ${w}${n === 1 ? "" : "s"}`)
    .join(", ") || "nothing";

export function BackupPanel() {
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [error, setError] = useState("");
  const meta = useMeta();

  const onFile = async (f: File | undefined) => {
    setError("");
    if (!f) return;
    if (f.size > 50_000_000) return setError("That file is too large to be a notes backup.");
    const res = validateBackup(await f.text());
    if (!res.ok) return setError(res.error);
    setPending(res.file);
  };
  const doImport = async (mode: "merge" | "replace") => {
    if (!pending) return;
    const ok = await importBackup(pending, mode);
    setPending(null);
    if (file.current) file.current.value = "";
    if (ok) toast.success(mode === "merge" ? "Notes merged" : "Notes replaced");
    else toast.error("Notes cannot be saved in this window.");
  };
  const copyAll = async () => {
    const notes = await listNotes();
    const parts: string[] = [];
    for (const n of notes) {
      const verses = await rangeText("kjv", n.start, n.end, 6).catch(() => []);
      parts.push(`${formatRange(n.start, n.end > n.start ? n.end : 0)} (${n.kind}, ${new Date(n.updatedAt).toLocaleDateString()})\n${verses.length ? verses.map(([, t]) => plain(t)).join(" ") + "\n" : ""}${n.body}${n.tags.length ? `\nTags: ${n.tags.join(", ")}` : ""}`);
    }
    if (await copyText(parts.join("\n\n---\n\n"))) toast.success(`Copied ${notes.length} ${notes.length === 1 ? "note" : "notes"} as text`);
    else toast.error("Could not copy.");
  };

  return (
    <section aria-label="Back up and restore" className="rounded-xl border bg-surface p-5">
      <h2 className="text-lg">Back up your notes</h2>
      <p className="mt-1 text-muted-foreground">
        Your notes live only in this browser. {meta.lastExportAt ? `Last export: ${new Date(meta.lastExportAt).toLocaleDateString()}.` : "You have not exported yet."} Keep a copy somewhere safe, and move to a new device by importing it there.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={async () => ((await downloadBackup()) ? toast.success("Notes exported") : toast.error("Nothing to export in this window."))} data-testid="export-notes">
          <Download aria-hidden="true" /> Export notes
        </Button>
        <Button variant="outline" onClick={() => file.current?.click()}>
          <Upload aria-hidden="true" /> Import notes
        </Button>
        <Button variant="outline" onClick={copyAll}>
          <Copy aria-hidden="true" /> Copy all notes as text
        </Button>
        <input ref={file} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a notes backup file" data-testid="import-file" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import this backup?</DialogTitle>
            <DialogDescription className="text-base text-foreground">
              This file has {pending ? countText(pending.counts) : ""}{pending?.exportedAt ? `, exported ${new Date(pending.exportedAt).toLocaleDateString()}` : ""}. Nothing changes until you choose.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li><strong className="text-foreground">Merge</strong> keeps what you have here and adds the rest. If both have the same note, the newer one wins.</li>
            <li><strong className="text-foreground">Replace</strong> deletes everything here and uses only this file.</li>
          </ul>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="outline" onClick={() => doImport("replace")} data-testid="import-replace">Replace</Button>
            <Button onClick={() => doImport("merge")} data-testid="import-merge">Merge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
