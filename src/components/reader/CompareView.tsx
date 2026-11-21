import { MarkedText } from "@/components/VerseText";
import { BOOKS } from "@/lib/canon/books";
import type { ChapterText } from "@/lib/data/text";
import type { Selection } from "@/lib/reader";
import { translationById } from "@/lib/translations";
import { onVerseKeys } from "./ChapterView";

export interface CompareColumn {
  tr: string;
  data: ChapterText | undefined;
  notes: Map<number, string[]>;
}

/** Translations side by side, aligned by verse number. On phones each verse stacks its translations. */
export function CompareView({ book, chapter, columns, selection, onVerse }: { book: number; chapter: number; columns: CompareColumn[]; selection: Selection | null; onVerse: (v: number, extend: boolean) => void }) {
  const count = Math.max(...columns.map((c) => c.data?.v.length ?? 0));
  const title = columns.map((c) => c.data?.t).find(Boolean);
  return (
    <div data-verses role="group" aria-label={`${BOOKS[book].name} chapter ${chapter}, compared`} className="max-w-5xl">
      {title && <p className="psalm-title scripture">{title}</p>}
      <div className="sticky top-[7.1rem] z-10 hidden gap-4 border-b bg-page/95 py-2 text-sm font-semibold text-muted-foreground md:grid" style={{ gridTemplateColumns: `2.5rem repeat(${columns.length}, minmax(0, 1fr))` }}>
        <span aria-hidden="true" />
        {columns.map((c) => (
          <span key={c.tr}>{translationById(c.tr).name}</span>
        ))}
      </div>
      <ol className="list-none">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
          const selected = !!selection && n >= selection[0] && n <= selection[1];
          return (
            <li key={n}>
              <div id={`v${n}`} data-verse={n} data-selected={selected} className="verse block cursor-pointer border-b py-3" onClick={(e) => { if (!(e.target as HTMLElement).closest("button, a")) onVerse(n, e.shiftKey); }}>
                <div className="compare-row grid gap-x-4 gap-y-2" style={{ ["--cols" as string]: columns.length }}>
                  <button
                    type="button"
                    data-vbtn
                    aria-pressed={selected}
                    aria-label={`Verse ${n}, ${BOOKS[book].name} ${chapter}:${n}, compare translations`}
                    className="vnb justify-self-start md:justify-self-end"
                    onClick={(e) => { e.stopPropagation(); onVerse(n, e.shiftKey); }}
                    onKeyDown={onVerseKeys}
                  >
                    {n}
                  </button>
                  {columns.map((c) => {
                    const text = c.data?.v[n - 1] ?? "";
                    const empty = !text.replace(/[\uE000-\uE006]/g, "").trim();
                    return (
                      <div key={c.tr} className="scripture min-w-0" style={{ fontSize: "calc(var(--scripture-size) * 0.94)" }}>
                        <span className="mr-2 text-xs font-semibold text-muted-foreground md:hidden" style={{ fontFamily: "var(--font-ui)" }}>
                          {translationById(c.tr).short}
                        </span>
                        {empty ? <em className="text-muted-foreground">Not in this translation.</em> : <MarkedText text={text} notes={c.notes.get(n)} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
