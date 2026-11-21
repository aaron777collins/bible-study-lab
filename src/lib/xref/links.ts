import { BOOKS } from "@/lib/canon/books";
import { bookOfId } from "@/lib/canon/canon";
import { getJson } from "@/lib/data/load";

export type Tier = "strong" | "medium" | "light" | "disputed";
export type Direction = "both" | "out" | "in";

export const TIER_LABEL: Record<Tier, string> = { strong: "Strong", medium: "Medium", light: "Light", disputed: "Disputed" };

/** Strong: 20 or more votes. Medium: 5 to 19. Light: 1 to 4. Disputed: 0 or fewer. */
export function tierOf(votes: number): Tier {
  if (votes >= 20) return "strong";
  if (votes >= 5) return "medium";
  if (votes >= 1) return "light";
  return "disputed";
}

export interface XLink {
  /** the other verse (first verse when it is a range) */
  id: number;
  /** last verse of the range, or 0 for a single verse */
  end: number;
  votes: number;
  /** out: this verse points to it. in: it points to this verse. both: each does. */
  dir: "out" | "in" | "both";
}

export type XrefBook = Record<string, number[]>;
export const loadXrefBook = (book: number) => getJson<XrefBook>(`xref/${BOOKS[book].osis}.json`);

/** Turn the flat [target, end, votes, ...] list for a verse into merged, ranked links. */
export function mergeLinks(flat: number[] | undefined): XLink[] {
  if (!flat) return [];
  const byKey = new Map<string, XLink>();
  for (let i = 0; i < flat.length; i += 3) {
    const raw = flat[i];
    const dir: "out" | "in" = raw < 0 ? "in" : "out";
    const id = raw < 0 ? -raw - 1 : raw;
    const end = flat[i + 1];
    const votes = flat[i + 2];
    // an "in" link has no range; match it with an "out" link to the same start verse
    const key = `${id}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { id, end, votes, dir });
    } else {
      if (prev.dir !== dir) prev.dir = "both";
      if (votes > prev.votes) prev.votes = votes;
      if (end && !prev.end) prev.end = end;
    }
  }
  return rankLinks([...byKey.values()]);
}

export function rankLinks(links: XLink[]): XLink[] {
  return links.sort((a, b) => b.votes - a.votes || a.id - b.id || a.end - b.end);
}

export async function linksForVerse(id: number): Promise<XLink[]> {
  const x = await loadXrefBook(bookOfId(id));
  return mergeLinks(x[id]);
}

export interface LinkFilter {
  minVotes: number;
  testament: "all" | "ot" | "nt";
  /** book indexes; empty means every book */
  books: number[];
  direction: Direction;
  showDisputed: boolean;
}
export const DEFAULT_FILTER: LinkFilter = { minVotes: 1, testament: "all", books: [], direction: "both", showDisputed: false };

export function filterLinks(links: XLink[], f: LinkFilter): XLink[] {
  return links.filter((l) => {
    if (l.votes <= 0 ? !f.showDisputed : l.votes < f.minVotes) return false;
    const b = bookOfId(l.id);
    if (f.testament !== "all" && BOOKS[b].testament !== f.testament) return false;
    if (f.books.length && !f.books.includes(b)) return false;
    if (f.direction === "out" && l.dir === "in") return false;
    if (f.direction === "in" && l.dir === "out") return false;
    return true;
  });
}

/** Count of links per book, for "group by book" and the distribution strip. */
export function countByBook(links: XLink[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const l of links) {
    const b = bookOfId(l.id);
    m.set(b, (m.get(b) ?? 0) + 1);
  }
  return m;
}

/** Strength bar scale: width as a fraction of the strongest link for this verse. */
export function strengthFraction(votes: number, top: number): number {
  if (top <= 0 || votes <= 0) return 0.04;
  return Math.max(0.04, Math.min(1, votes / top));
}

// summaries
export interface XrefSummary {
  totalLinks: number;
  positiveLinks: number;
  linkedVerses: number;
  topWeight: [id: number, weight: number, count: number][];
  topCount: [id: number, weight: number, count: number][];
  bookOut: number[];
  bookIn: number[];
  matrix: number[];
  matrixCount: number[];
  chapterWeight: number[][];
}
export const loadSummary = () => getJson<XrefSummary>("xref/summary.json");

/** Links for one verse or a short passage. Verses inside the passage are left out of the result. */
export async function linksForVerses(ids: number[]): Promise<XLink[]> {
  const flats: number[] = [];
  for (const id of ids) {
    const x = await loadXrefBook(bookOfId(id));
    const f = x[id];
    if (f) for (const n of f) flats.push(n);
  }
  const set = new Set(ids);
  return mergeLinks(flats).filter((l) => !set.has(l.id));
}
