import { ALL_CHAPTERS, chapterIndex, verseCount } from "./canon/canon";

export type Selection = [first: number, last: number];

/** "16" or "16-18" to [16, 18]. Returns null for anything else or out of range. */
export function parseVerseParam(v: string | null, max: number): Selection | null {
  if (!v) return null;
  const m = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(v);
  if (!m) return null;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : a;
  if (a < 1 || b < a || b > max) return null;
  return [a, b];
}

export function formatVerseParam(sel: Selection | null): string | null {
  if (!sel) return null;
  return sel[0] === sel[1] ? String(sel[0]) : `${sel[0]}-${sel[1]}`;
}

export function chapterNeighbors(book: number, chapter: number) {
  const i = chapterIndex(book, chapter);
  return { prev: ALL_CHAPTERS[i - 1] ?? null, next: ALL_CHAPTERS[i + 1] ?? null };
}

/** Which verses start a paragraph, as paragraphs of verse numbers. */
export function paragraphs(count: number, starts: number[] | undefined, perVerse: boolean): number[][] {
  const out: number[][] = [];
  const startSet = new Set(starts ?? []);
  for (let n = 1; n <= count; n++) {
    if (perVerse || n === 1 || startSet.has(n) || out.length === 0) out.push([n]);
    else out[out.length - 1].push(n);
  }
  return out;
}

export const maxVerse = (book: number, chapter: number) => verseCount(book, chapter);

/** Extend a selection when the person adds a verse (shift click or range mode). */
export function extendSelection(sel: Selection | null, v: number): Selection {
  if (!sel) return [v, v];
  if (v < sel[0]) return [v, sel[1]];
  if (v > sel[1]) return [sel[0], v];
  return [v, v];
}
