import { Fragment, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const WJ_OPEN = "";
const WJ_CLOSE = "";
const ADD_OPEN = "";
const ADD_CLOSE = "";
const ND_OPEN = "";
const ND_CLOSE = "";
const NOTE = "";

/**
 * Turn stored verse text into elements: words of Jesus, added words (italic), the divine name in small capitals
 * and footnote markers that open a small popover.
 */
export function MarkedText({ text, notes = [] }: { text: string; notes?: string[] }): ReactNode {
  const out: ReactNode[] = [];
  let wj = false;
  let add = false;
  let nd = false;
  let buf = "";
  let noteIndex = 0;
  let key = 0;
  const flush = () => {
    if (!buf) return;
    const cls = [wj ? "wj" : "", add ? "added" : "", nd ? "nd" : ""].filter(Boolean).join(" ");
    out.push(cls ? <span key={key++} className={cls}>{buf}</span> : <Fragment key={key++}>{buf}</Fragment>);
    buf = "";
  };
  for (const ch of text) {
    if (ch === WJ_OPEN) (flush(), (wj = true));
    else if (ch === WJ_CLOSE) (flush(), (wj = false));
    else if (ch === ADD_OPEN) (flush(), (add = true));
    else if (ch === ADD_CLOSE) (flush(), (add = false));
    else if (ch === ND_OPEN) (flush(), (nd = true));
    else if (ch === ND_CLOSE) (flush(), (nd = false));
    else if (ch === NOTE) {
      flush();
      const n = notes[noteIndex++];
      if (n) out.push(<NoteAnchor key={key++} index={noteIndex} text={n} />);
    } else buf += ch;
  }
  flush();
  return <>{out}</>;
}

export function NoteAnchor({ text, index }: { text: string; index: number }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="note-anchor" aria-label={`Footnote ${index}`} onClick={(e) => e.stopPropagation()}>
          <sup>{"†"}</sup>
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm" onClick={(e) => e.stopPropagation()}>
        <p className="font-sans">{text}</p>
      </PopoverContent>
    </Popover>
  );
}

export const hasNote = (text: string) => text.includes(NOTE);
