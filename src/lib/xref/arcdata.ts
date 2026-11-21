import { BOOKS } from "@/lib/canon/books";
import { BOOK_START, bookOfId } from "@/lib/canon/canon";
import type { Arc } from "./arcs";

export type TestamentFilter = "all" | "ot" | "nt";

/** Read edges5.bin: Uint16 triples of from, to, votes. */
export function parseEdges(buf: ArrayBuffer): Uint16Array {
  return new Uint16Array(buf);
}

export interface ArcFilter {
  min: number;
  from: TestamentFilter;
  to: TestamentFilter;
  /** book indexes; empty means all. An arc passes if either end is in the list. */
  books: number[];
}

const inTestament = (book: number, t: TestamentFilter) => t === "all" || BOOKS[book].testament === t;

export function verseArcs(edges: Uint16Array, f: ArcFilter): Arc[] {
  const out: Arc[] = [];
  const books = new Set(f.books);
  for (let i = 0; i < edges.length; i += 3) {
    const votes = edges[i + 2];
    if (votes < f.min) continue;
    const from = edges[i];
    const to = edges[i + 1];
    const fb = bookOfId(from);
    const tb = bookOfId(to);
    if (!inTestament(fb, f.from) || !inTestament(tb, f.to)) continue;
    if (books.size && !books.has(fb) && !books.has(tb)) continue;
    out.push({ a: from, b: to, w: votes, fwd: to > from, from, to });
  }
  return out;
}

export function bookCenter(book: number): number {
  return (BOOK_START[book] + BOOK_START[book + 1]) / 2;
}

/** One arc per ordered pair of books, drawn between the middles of the two books. Self links are left out. */
export function bookArcs(matrix: number[], f: { from: TestamentFilter; to: TestamentFilter; books: number[]; top: number }): Arc[] {
  const out: Arc[] = [];
  const books = new Set(f.books);
  for (let i = 0; i < 66; i++) {
    if (!inTestament(i, f.from)) continue;
    for (let j = 0; j < 66; j++) {
      if (i === j || !inTestament(j, f.to)) continue;
      const w = matrix[i * 66 + j];
      if (w <= 0) continue;
      if (books.size && !books.has(i) && !books.has(j)) continue;
      out.push({ a: bookCenter(i), b: bookCenter(j), w, fwd: j > i, from: i, to: j });
    }
  }
  out.sort((x, y) => y.w - x.w);
  return out.slice(0, f.top);
}

export interface BookTotals {
  book: number;
  out: number;
  in: number;
  total: number;
  perVerseOut: number;
  perVerseIn: number;
}
export function bookTotals(bookOut: number[], bookIn: number[]): BookTotals[] {
  return BOOKS.map((_, book) => {
    const verses = BOOK_START[book + 1] - BOOK_START[book];
    return { book, out: bookOut[book], in: bookIn[book], total: bookOut[book] + bookIn[book], perVerseOut: bookOut[book] / verses, perVerseIn: bookIn[book] / verses };
  });
}
