import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { saveNote } from "@/lib/store/repo";
import type { Note, NoteKind } from "@/lib/store/types";

export function NoteForm({ start, end, existing, onDone, defaultKind = "note" }: { start: number; end: number; existing?: Note; onDone?: () => void; defaultKind?: NoteKind }) {
  const [body, setBody] = useState(existing?.body ?? "");
  const [tags, setTags] = useState((existing?.tags ?? []).join(", "));
  const [kind, setKind] = useState<NoteKind>(existing?.kind ?? defaultKind);
  const [observe, setObserve] = useState(existing?.prompts?.observe ?? "");
  const [interpret, setInterpret] = useState(existing?.prompts?.interpret ?? "");
  const [apply, setApply] = useState(existing?.prompts?.apply ?? "");
  const [busy, setBusy] = useState(false);
  const hasPrompts = kind === "study";

  const save = async () => {
    if (!body.trim() && !(observe || interpret || apply)) return;
    setBusy(true);
    const saved = await saveNote({
      id: existing?.id,
      start: existing?.start ?? start,
      end: existing?.end ?? end,
      body: body.trim(),
      tags: tags.split(/[,\n]/),
      kind,
      prompts: hasPrompts ? { observe, interpret, apply } : undefined,
    });
    setBusy(false);
    if (!saved) {
      toast.error("Notes cannot be saved in this window. Try a normal browser window.");
      return;
    }
    toast.success(existing ? "Note updated" : "Note saved");
    if (!existing) {
      setBody("");
      setTags("");
      setObserve("");
      setInterpret("");
      setApply("");
    }
    onDone?.();
  };

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="grid gap-1.5">
        <Label id="note-kind">What kind of note?</Label>
        <ToggleGroup type="single" variant="outline" size="sm" value={kind} onValueChange={(v) => v && setKind(v as NoteKind)} aria-labelledby="note-kind" className="justify-start">
          <ToggleGroupItem value="note">Note</ToggleGroupItem>
          <ToggleGroupItem value="prayer">Prayer</ToggleGroupItem>
          <ToggleGroupItem value="study">Guided study</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="note-body">{kind === "prayer" ? "Your prayer" : kind === "study" ? "Summary" : "Your note"}</Label>
        <Textarea id="note-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder={kind === "prayer" ? "What would you like to bring to God?" : "What stands out to you?"} />
      </div>
      {hasPrompts && (
        <div className="grid gap-3 rounded-md border bg-wash p-3">
          <div className="grid gap-1.5">
            <Label htmlFor="obs">Observe: what does it say?</Label>
            <Textarea id="obs" rows={2} value={observe} onChange={(e) => setObserve(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="int">Interpret: what does it mean?</Label>
            <Textarea id="int" rows={2} value={interpret} onChange={(e) => setInterpret(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="app">Apply: what will I do about it?</Label>
            <Textarea id="app" rows={2} value={apply} onChange={(e) => setApply(e.target.value)} />
          </div>
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="note-tags">Tags (optional, separated by commas)</Label>
        <Input id="note-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="grace, sermon, family" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy || (!body.trim() && !(observe || interpret || apply))}>
          {existing ? "Save changes" : "Save note"}
        </Button>
        {existing && onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
