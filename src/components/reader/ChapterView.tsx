import { Fragment, type KeyboardEvent, type ReactNode } from "react";
import { Bookmark, StickyNote } from "lucide-react";
import { MarkedText } from "@/components/VerseText";
import { BOOKS } from "@/lib/canon/books";
import { toId } from "@/lib/canon/canon";
import type { ChapterText } from "@/lib/data/text";
import { paragraphs, type Selection } from "@/lib/reader";
import type { HighlightColor } from "@/lib/store/types";
import { HIGHLIGHT_LABEL } from "@/lib/store/types";

export type Token = string | [word: string, strong: string];

export interface ChapterViewProps {
  book: number;
  chapter: number;
  data: ChapterText;
  footnotes: Map<number, string[]>;
  tokens?: Token[][];
  selection: Selection | null;
  onVerse: (v: number, extend: boolean) => void;
  highlights: Map<number, HighlightColor>;
  noted: Set<number>;
  bookmarked: Set<number>;
  layout: "paragraphs" | "verses";
  onStrong?: (strong: string, verse: number) => void;
  activeStrong?: string | null;
}

function plainOf(text: string) {
  return text.replace(/[-]/g, "");
}

/** Move focus between verses with the arrow keys. */
export function onVerseKeys(e: KeyboardEvent<HTMLElement>) {
  const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  const step = keys[e.key];
  if (step === undefined && e.key !== "Home" && e.key !== "End") return;
  const root = e.currentTarget.closest("[data-verses]");
  if (!root) return;
  const all = [...root.querySelectorAll<HTMLElement>("button[data-vbtn]")];
  const i = all.indexOf(e.currentTarget);
  let next = i + (step ?? 0);
  if (e.key === "Home") next = 0;
  if (e.key === "End") next = all.length - 1;
  if (next < 0 || next >= all.length) return;
  e.preventDefault();
  all[next].focus();
  if (e.shiftKey) all[next].click();
}

export function ChapterView(props: ChapterViewProps) {
  const { book, chapter, data, footnotes, tokens, selection, onVerse, highlights, noted, bookmarked, layout, onStrong, activeStrong } = props;
  const count = data.v.length;
  const paras = paragraphs(count, data.p, layout === "verses");
  const poetry = new Set(data.q ?? []);
  const bookName = BOOKS[book].name;

  const verse = (n: number): ReactNode => {
    const text = data.v[n - 1] ?? "";
    const id = n <= 0 || toId(book, chapter, Math.min(n, 1)) < 0 ? -1 : safeId(book, chapter, n);
    const selected = !!selection && n >= selection[0] && n <= selection[1];
    const hl = id >= 0 ? highlights.get(id) : undefined;
    const isEmpty = !plainOf(text).trim();
    const label = `Verse ${n}, ${bookName} ${chapter}:${n}${hl ? `, highlighted ${HIGHLIGHT_LABEL[hl]}` : ""}${noted.has(id) ? ", has a note" : ""}${isEmpty ? ", not in this translation" : ""}`;
    const notes = footnotes.get(n);
    const toks = tokens?.[n - 1];
    return (
      <span
        key={n}
        id={`v${n}`}
        data-verse={n}
        className="verse"
        data-selected={selected}
        data-hl={hl}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button, a")) return;
          onVerse(n, e.shiftKey);
        }}
      >
        <button
          type="button"
          data-vbtn
          className={n === 1 ? "vnb sr-only focus:not-sr-only" : "vnb"}
          aria-pressed={selected}
          aria-label={label}
          onClick={(e) => {
            e.stopPropagation();
            onVerse(n, e.shiftKey);
          }}
          onKeyDown={onVerseKeys}
        >
          {n}
        </button>
        {hl && <span className="hl-mark" data-c={hl} aria-hidden="true" />}
        <span className="vtext">
          {isEmpty ? (
            <em className="text-muted-foreground">{notes ? "" : "This verse is not in this translation."}{notes ? <MarkedText text={"\uE006"} notes={notes} /> : null}</em>
          ) : toks ? (
            <Tokens tokens={toks} notes={notes} onStrong={(s) => onStrong?.(s, n)} active={activeStrong ?? null} />
          ) : (
            <MarkedText text={text} notes={notes} />
          )}
        </span>
        {noted.has(id) && <StickyNote className="ml-1 inline size-3.5 align-baseline text-gilt" aria-hidden="true" />}
        {bookmarked.has(id) && <Bookmark className="ml-0.5 inline size-3.5 align-baseline text-lapis" aria-hidden="true" />}{" "}
      </span>
    );
  };

  return (
    <div data-verses className="scripture" lang="en" role="group" aria-label={`${bookName} chapter ${chapter}`}>
      {data.t && <p className="psalm-title">{data.t}</p>}
      {paras.map((p, i) => {
        const isPoetry = p.every((n) => poetry.has(n)) && layout === "paragraphs";
        return (
          <p key={p[0]} className={`${isPoetry ? "poetry" : ""} ${layout === "verses" ? "mb-1" : "mb-4"}`}>
            {i === 0 && !isPoetry && <span className="chapter-numeral" data-digits={String(chapter).length} aria-hidden="true">{chapter}</span>}
            {p.map((n) => (
              <Fragment key={n}>{verse(n)}</Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function safeId(book: number, chapter: number, n: number) {
  try {
    return toId(book, chapter, n);
  } catch {
    return -1;
  }
}

function Tokens({ tokens, notes, onStrong, active }: { tokens: Token[]; notes?: string[]; onStrong: (s: string) => void; active: string | null }) {
  // markers stay in plain strings, so state (red letter, italics) must carry across tokens
  let wj = false;
  let add = false;
  let nd = false;
  let noteIndex = 0;
  const out: ReactNode[] = [];
  tokens.forEach((t, i) => {
    if (typeof t === "string") {
      let buf = "";
      const flush = () => {
        if (!buf) return;
        const cls = [wj ? "wj" : "", add ? "added" : "", nd ? "nd" : ""].filter(Boolean).join(" ");
        out.push(cls ? <span key={`${i}-${out.length}`} className={cls}>{buf}</span> : <Fragment key={`${i}-${out.length}`}>{buf}</Fragment>);
        buf = "";
      };
      for (const ch of t) {
        if (ch === "") (flush(), (wj = true));
        else if (ch === "") (flush(), (wj = false));
        else if (ch === "") (flush(), (add = true));
        else if (ch === "") (flush(), (add = false));
        else if (ch === "") (flush(), (nd = true));
        else if (ch === "") (flush(), (nd = false));
        else if (ch === "") {
          flush();
          const n = notes?.[noteIndex++];
          if (n) out.push(<MarkedText key={`${i}-n${noteIndex}`} text={""} notes={[n]} />);
        } else buf += ch;
      }
      flush();
    } else {
      const [word, num] = t;
      const cls = [wj ? "wj" : "", add ? "added" : "", nd ? "nd" : ""].join(" ").trim();
      out.push(
        // A span with a button role, not a <button>: a real button is an atomic inline, so a line can break between it
        // and the comma or colon that follows. A span keeps the punctuation on the same line as its word.
        <span
          key={`${i}-w`}
          role="button"
          tabIndex={0}
          className={`strongs-word ${cls}`}
          aria-label={`${word}, Strong's ${num}`}
          style={active === num ? { background: "var(--lapis-wash)" } : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onStrong(num);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onStrong(num);
            }
          }}
        >
          {word}
        </span>,
      );
    }
  });
  return <>{out}</>;
}
