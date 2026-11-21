import { Link } from "react-router";
import { Page } from "@/components/Page";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS, type Section } from "@/lib/canon/books";
import { bookVerseCount, chapterCount } from "@/lib/canon/canon";
import { overviewFor } from "@/content/books";

const ORDER: Section[] = ["Law", "History", "Wisdom and poetry", "Major prophets", "Minor prophets", "Gospels", "Acts", "Paul's letters", "General letters", "Revelation"];

export function Component() {
  useDocumentTitle("Book overviews");
  return (
    <Page wide title="Book overviews" intro="A plain introduction to each of the 66 books. Where scholars and traditions differ, the overview says so rather than choosing a side.">
      {ORDER.map((s) => (
        <section key={s} aria-label={s} className="mb-8">
          <h2 className="mb-3 text-xl">{s}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BOOKS.map((b, i) => ({ b, i })).filter(({ b }) => b.section === s).map(({ b, i }) => (
              <li key={b.osis}>
                <Link to={`/books/${b.slug}`} className="block h-full rounded-xl border bg-surface p-4 no-underline hover:bg-accent">
                  <span className="block text-lg font-semibold text-foreground">{b.name}</span>
                  <span className="block text-sm text-muted-foreground">{chapterCount(i)} {chapterCount(i) === 1 ? "chapter" : "chapters"}, {bookVerseCount(i).toLocaleString()} verses</span>
                  <span className="mt-1 line-clamp-3 block text-sm text-foreground">{overviewFor(b.osis)?.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Page>
  );
}
