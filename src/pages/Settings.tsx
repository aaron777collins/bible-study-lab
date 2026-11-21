import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Page } from "@/components/Page";
import { ReadingOptions } from "@/components/ReadingOptions";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cachesSupported, downloadGroups, formatSize, loadGroups, removeGroups, savedCounts, storageSummary, type FileGroup } from "@/lib/offline";
import { usePrefs, type ThemeChoice } from "@/lib/prefs";
import { getDb, resetDb } from "@/lib/store/db";
import { requestPersistence } from "@/lib/store/meta";
import { TRANSLATIONS } from "@/lib/translations";

function Offline() {
  const groups = useAsync(loadGroups, []);
  const [picked, setPicked] = useState<Set<string>>(new Set(["text-kjv"]));
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = async (g: FileGroup[]) => setSaved(await savedCounts(g));
  useEffect(() => {
    if (groups.data) void refresh(groups.data);
  }, [groups.data]);
  if (!cachesSupported()) return <p className="text-muted-foreground">This browser cannot save files for offline use.</p>;
  const list = groups.data ?? [];
  const chosen = list.filter((g) => picked.has(g.id));
  const needed = chosen.filter((g) => (saved[g.id] ?? 0) < g.files.length);
  const size = needed.reduce((a, g) => a + g.gzipBytes, 0);
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const run = async () => {
    setBusy(true);
    try {
      await downloadGroups(needed, (done, total) => setProgress({ done, total }));
      toast.success("Saved for offline use");
    } catch {
      toast.error("The download stopped. Check your connection and try again.");
    } finally {
      setBusy(false);
      setProgress(null);
      await refresh(list);
    }
  };
  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground">Chapters you open are saved automatically. To read everything with no connection, choose what to download. The app itself is always available offline after your first visit.</p>
      <ul className="grid gap-2">
        {list.map((g) => {
          const full = (saved[g.id] ?? 0) >= g.files.length;
          return (
            <li key={g.id} className="flex items-center gap-3 rounded-md border bg-surface px-3 py-2.5">
              <Checkbox id={`g-${g.id}`} checked={picked.has(g.id)} onCheckedChange={() => toggle(g.id)} className="size-5" />
              <Label htmlFor={`g-${g.id}`} className="flex-1 font-normal">
                {g.label}
                <span className="block text-sm text-muted-foreground">{formatSize(g.gzipBytes)}{full ? ", saved on this device" : saved[g.id] ? `, ${saved[g.id]} of ${g.files.length} files saved` : ""}</span>
              </Label>
              {full && <Button size="sm" variant="ghost" onClick={async () => { await removeGroups([g]); await refresh(list); toast("Removed from this device"); }}>Remove</Button>}
            </li>
          );
        })}
      </ul>
      {progress && <Progress value={(progress.done / progress.total) * 100} aria-label={`Downloaded ${progress.done} of ${progress.total} files`} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={busy || needed.length === 0} onClick={run}>{needed.length === 0 ? "Nothing to download" : `Download ${formatSize(size)}`}</Button>
        {chosen.length > 0 && needed.length === 0 && <span className="text-sm text-muted-foreground">Everything you picked is already saved.</span>}
      </div>
    </div>
  );
}

function Storage() {
  const [info, setInfo] = useState<{ usage?: number; quota?: number; persisted?: boolean }>({});
  const [askAgain, setAskAgain] = useState(0);
  useEffect(() => { void storageSummary().then(setInfo); }, [askAgain]);
  return (
    <div className="grid gap-2 text-sm">
      <p>{info.persisted ? "This browser agreed to keep your notes." : "This browser may clear your notes when space runs low."}</p>
      {info.usage !== undefined && info.quota !== undefined && <p className="text-muted-foreground">Using {formatSize(info.usage)} of about {formatSize(info.quota)} available to this site.</p>}
      {!info.persisted && <div><Button size="sm" variant="outline" onClick={async () => { const ok = await requestPersistence(); toast(ok ? "This browser will keep your notes." : "The browser did not agree. Export a copy to be safe."); setAskAgain((n) => n + 1); }}>Ask the browser to keep my notes</Button></div>}
    </div>
  );
}

export function Component() {
  useDocumentTitle("Settings");
  const p = usePrefs();
  const [confirm, setConfirm] = useState(false);
  return (
    <Page title="Settings" intro="Your choices are saved on this device only.">
      <div className="grid gap-8">
        <section aria-label="Appearance" className="grid gap-4">
          <h2 className="text-xl">Appearance</h2>
          <div className="grid gap-1.5">
            <Label id="theme-l">Theme</Label>
            <ToggleGroup type="single" variant="outline" value={p.theme} onValueChange={(v) => v && p.set({ theme: v as ThemeChoice })} aria-labelledby="theme-l" className="justify-start">
              <ToggleGroupItem value="system">Match my device</ToggleGroupItem>
              <ToggleGroupItem value="light">Day</ToggleGroupItem>
              <ToggleGroupItem value="dark">Vigil (dark)</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <ReadingOptions />
          <div className="rounded-md border bg-surface p-4">
            <p className="scripture">In the beginning God created the heaven and the earth.</p>
          </div>
        </section>

        <section aria-label="Default translation" className="grid gap-2">
          <h2 className="text-xl">Default translation</h2>
          <Select value={p.translation} onValueChange={(v) => p.set({ translation: v })}>
            <SelectTrigger className="w-72" aria-label="Default translation"><SelectValue>{TRANSLATIONS.find((t) => t.id === p.translation)?.name}</SelectValue></SelectTrigger>
            <SelectContent>{TRANSLATIONS.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} <span className="text-muted-foreground">{t.blurb}</span></SelectItem>)}</SelectContent>
          </Select>
        </section>

        <section aria-label="Offline" className="grid gap-3">
          <h2 className="text-xl">Download for offline</h2>
          <Offline />
        </section>

        <section aria-label="Your notes" className="grid gap-3">
          <h2 className="text-xl">Your notes and storage</h2>
          <Storage />
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link to="/notes?tab=backup">Export or import notes</Link></Button>
            <Button variant="outline" onClick={() => setConfirm(true)}>Delete all my notes and progress</Button>
          </div>
        </section>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete everything saved in this browser?</DialogTitle>
            <DialogDescription className="text-base text-foreground">This removes all notes, prayers, highlights, bookmarks, collections, plan progress and memory verses from this browser. It cannot be undone. Export a copy first if you might want them back.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              (await getDb())?.close();
              await new Promise<void>((resolve) => { const r = indexedDB.deleteDatabase("bsl"); r.onsuccess = r.onerror = r.onblocked = () => resolve(); });
              resetDb();
              await getDb();
              setConfirm(false);
              toast.success("Everything was deleted from this browser.");
            }}>Delete everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
