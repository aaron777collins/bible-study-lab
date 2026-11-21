import { useState } from "react";
import { Link } from "react-router";
import { BOOKS } from "@/lib/canon/books";
import { chapterCount } from "@/lib/canon/canon";
import { readPath } from "@/lib/nav";

/** Book and chapter picker. Shows the chapter grid for the open book. */
export function BookNavAll(props: { book: number; chapter: number; onNavigate?: () => void; query?: string }) {
  return (
    <nav aria-label="Books and chapters">
      <BookNavSection {...props} from={0} to={39} label="Old Testament" />
      <BookNavSection {...props} from={39} to={66} label="New Testament" />
    </nav>
  );
}

function BookNavSection({ book, chapter, onNavigate, query, from, to, label }: { book: number; chapter: number; onNavigate?: () => void; query?: string; from: number; to: number; label: string }) {
  const [open, setOpen] = useState(book);
  return (
    <section aria-label={label} className="mb-4">
      <h2 className="px-2 pb-1 text-sm font-semibold text-muted-foreground">{label}</h2>
      <ul>
        {BOOKS.slice(from, to).map((b, k) => {
          const i = from + k;
          const isOpen = open === i;
          return (
            <li key={b.osis}>
              <button
                type="button"
                className={`flex min-h-11 w-full items-center justify-between rounded-md px-2 text-left text-[0.9375rem] hover:bg-accent ${i === book ? "font-semibold text-lapis" : ""}`}
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                {b.name}
                <span className="text-xs text-muted-foreground">{chapterCount(i)}</span>
              </button>
              {isOpen && (
                <ul className="grid grid-cols-6 gap-1 px-2 pb-3 pt-1" aria-label={`${b.name} chapters`}>
                  {Array.from({ length: chapterCount(i) }, (_, c) => c + 1).map((c) => {
                    const current = i === book && c === chapter;
                    return (
                      <li key={c}>
                        <Link
                          to={readPath(i, c, query)}
                          onClick={onNavigate}
                          aria-current={current ? "page" : undefined}
                          className="flex h-10 items-center justify-center rounded-md text-sm no-underline hover:bg-accent"
                          style={current ? { background: "var(--lapis)", color: "var(--on-lapis)" } : { color: "var(--ink)" }}
                        >
                          {c}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
