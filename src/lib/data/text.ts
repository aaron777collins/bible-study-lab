import { BOOKS } from "@/lib/canon/books";
import { fromId, verseCount } from "@/lib/canon/canon";
import { getJson } from "./load";
import { NOTES_BOOKS } from "./notes.generated";

export interface ChapterText {
  /** verse n is v[n - 1] */
  v: string[];
  /** verse numbers that start a paragraph */
  p?: number[];
  /** verse numbers set as poetry */
  q?: number[];
  /** psalm title */
  t?: string;
}
export interface BookText {
  c: ChapterText[];
}
export type VerseNotes = [chapter: number, verse: number, notes: string[]][];

export const loadBookText = (tr: string, book: number) => getJson<BookText>(`text/${tr}/${BOOKS[book].osis}.json`);
/** True when this translation has a footnotes file for the book. Only some books do, so the app asks for no others. */
export const hasBookNotes = (tr: string, book: number): boolean => NOTES_BOOKS[tr]?.includes(BOOKS[book].osis) ?? false;
export const loadBookNotes = (tr: string, book: number): Promise<VerseNotes> =>
  hasBookNotes(tr, book) ? getJson<VerseNotes>(`text/${tr}/${BOOKS[book].osis}.notes.json`).catch(() => [] as VerseNotes) : Promise.resolve([]);

export async function loadChapter(tr: string, book: number, chapter: number): Promise<ChapterText | undefined> {
  return (await loadBookText(tr, book)).c[chapter - 1];
}

/** Text of one verse by id, or "" if the translation has none. */
export async function verseText(tr: string, id: number): Promise<string> {
  const r = fromId(id);
  const ch = await loadChapter(tr, r.book, r.chapter);
  return ch?.v[r.verse - 1] ?? "";
}

/** Verses from start to end (inclusive ids), as [id, text] pairs. Loads each needed book once. */
export async function rangeText(tr: string, start: number, end: number, maxVerses = 400): Promise<[number, string][]> {
  const out: [number, string][] = [];
  const last = Math.min(end, start + maxVerses - 1);
  for (let id = start; id <= last; id++) out.push([id, await verseText(tr, id)]);
  return out;
}

/** Strip the private-use marker characters used for red letter, added words and notes. */
export function plain(text: string): string {
  return text.replace(/[-]/g, "").replace(/\s+/g, " ").trim();
}

export function chapterVerseCount(book: number, chapter: number): number {
  return verseCount(book, chapter);
}
