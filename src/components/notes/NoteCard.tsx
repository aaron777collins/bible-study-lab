import { useState } from "react";
import { Link } from "react-router";
import { toast } from "@/lib/toast";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRange } from "@/lib/canon/parse";
import { versePath } from "@/lib/nav";
import { restore, setPrayerAnswered, softDelete } from "@/lib/store/repo";
import type { Note } from "@/lib/store/types";
import { NoteForm } from "./NoteForm";

const KIND_LABEL = { note: "Note", prayer: "Prayer", study: "Guided study" } as const;

export function NoteCard({ note, showRef = true }: { note: Note; showRef?: boolean }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <NoteForm start={note.start} end={note.end} existing={note} onDone={() => setEditing(false)} />;
  return (
    <article className="rounded-md border bg-surface p-3" aria-label={`${KIND_LABEL[note.kind]} on ${formatRange(note.start, note.end)}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
        {showRef && (
          <Link to={versePath(note.start)} className="font-semibold">
            {formatRange(note.start, note.end > note.start ? note.end : 0)}
          </Link>
        )}
        <Badge variant="secondary">{KIND_LABEL[note.kind]}</Badge>
        {note.answeredAt && <Badge className="gap-1"><Check className="size-3" aria-hidden="true" /> Answered {new Date(note.answeredAt).toLocaleDateString()}</Badge>}
        <span className="ml-auto text-xs text-muted-foreground">{new Date(note.updatedAt).toLocaleDateString()}</span>
      </div>
      {note.body && <p className="whitespace-pre-wrap text-[0.9375rem]">{note.body}</p>}
      {note.prompts && (
        <dl className="mt-2 grid gap-1 text-sm">
          {([["Observe", note.prompts.observe], ["Interpret", note.prompts.interpret], ["Apply", note.prompts.apply]] as const).map(([k, v]) =>
            v ? (
              <div key={k}>
                <dt className="font-semibold">{k}</dt>
                <dd className="whitespace-pre-wrap text-muted-foreground">{v}</dd>
              </div>
            ) : null,
          )}
        </dl>
      )}
      {note.tags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tags">
          {note.tags.map((t) => (
            <li key={t}>
              <Badge variant="outline">#{t}</Badge>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil aria-hidden="true" /> Edit
        </Button>
        {note.kind === "prayer" && (
          <Button size="sm" variant="ghost" onClick={() => setPrayerAnswered(note.id, !note.answeredAt)}>
            <Check aria-hidden="true" /> {note.answeredAt ? "Mark unanswered" : "Mark answered"}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            await softDelete("notes", note.id);
            toast("Note deleted", { action: { label: "Undo", onClick: () => restore("notes", note.id) }, duration: 8000 });
          }}
        >
          <Trash2 aria-hidden="true" /> Delete
        </Button>
      </div>
    </article>
  );
}
