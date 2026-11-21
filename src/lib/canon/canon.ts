import { BOOKS, BOOK_COUNT } from "./books.ts";
import { VERSE_COUNTS } from "./versification.generated.ts";

/** A verse id is the verse's position in KJV order, 0 to 31,101. */
export const TOTAL_VERSES = 31102;

/** First verse id of each book; one extra entry at the end equal to TOTAL_VERSES. */
export const BOOK_START: number[] = [];
/** First verse id of each chapter within a book: CHAPTER_START[book][chapter - 1]. */
export const CHAPTER_START: number[][] = [];
{
  let n = 0;
  for (let b = 0; b < BOOK_COUNT; b++) {
    BOOK_START.push(n);
    const starts: number[] = [];
    for (const c of VERSE_COUNTS[b]) {
      starts.push(n);
      n += c;
    }
    CHAPTER_START.push(starts);
  }
  BOOK_START.push(n);
}

export function chapterCount(book: number): number {
  return VERSE_COUNTS[book].length;
}
export function verseCount(book: number, chapter: number): number {
  return VERSE_COUNTS[book][chapter - 1] ?? 0;
}
export function bookVerseCount(book: number): number {
  return BOOK_START[book + 1] - BOOK_START[book];
}

export interface VerseRef {
  book: number;
  chapter: number;
  verse: number;
}

export function isValidRef(book: number, chapter: number, verse: number): boolean {
  return book >= 0 && book < BOOK_COUNT && chapter >= 1 && chapter <= chapterCount(book) && verse >= 1 && verse <= verseCount(book, chapter);
}

export function toId(book: number, chapter: number, verse: number): number {
  return CHAPTER_START[book][chapter - 1] + verse - 1;
}

export function bookOfId(id: number): number {
  let lo = 0;
  let hi = BOOK_COUNT - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (BOOK_START[mid] <= id) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function fromId(id: number): VerseRef {
  const book = bookOfId(id);
  const starts = CHAPTER_START[book];
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= id) lo = mid;
    else hi = mid - 1;
  }
  return { book, chapter: lo + 1, verse: id - starts[lo] + 1 };
}

/** Parse an OSIS verse id such as "John.3.16" or "1Cor.13.4". Returns -1 if it is not a KJV verse. */
export function idFromOsis(osis: string, clampVerse = false): number {
  const m = /^([0-9A-Za-z]+)\.(\d+)\.(\d+)$/.exec(osis);
  if (!m) return -1;
  const book = BOOKS.findIndex((b) => b.osis === m[1]);
  if (book < 0) return -1;
  const c = Number(m[2]);
  let v = Number(m[3]);
  if (clampVerse && c >= 1 && c <= chapterCount(book) && v > verseCount(book, c)) v = verseCount(book, c);
  return isValidRef(book, c, v) ? toId(book, c, v) : -1;
}

export function osisFromId(id: number): string {
  const r = fromId(id);
  return `${BOOKS[r.book].osis}.${r.chapter}.${r.verse}`;
}

/** Id of the verse before or after, staying inside the Bible. */
export function nextId(id: number): number {
  return Math.min(id + 1, TOTAL_VERSES - 1);
}
export function prevId(id: number): number {
  return Math.max(id - 1, 0);
}

/** Chapters across the whole Bible, in order: 1,189 entries. */
export interface ChapterRef {
  book: number;
  chapter: number;
}
export const ALL_CHAPTERS: ChapterRef[] = [];
for (let b = 0; b < BOOK_COUNT; b++) for (let c = 1; c <= chapterCount(b); c++) ALL_CHAPTERS.push({ book: b, chapter: c });

export function chapterIndex(book: number, chapter: number): number {
  let n = 0;
  for (let b = 0; b < book; b++) n += chapterCount(b);
  return n + chapter - 1;
}
