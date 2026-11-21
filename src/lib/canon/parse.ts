import { BOOKS } from "./books.ts";
import { chapterCount, fromId, isValidRef, toId, verseCount } from "./canon.ts";

/** A passage inside one book, or a verse range as ids when it crosses books (see formatRange). */
export interface Passage {
  book: number;
  c1: number;
  v1: number;
  c2: number;
  v2: number;
  /** true when the person gave only a chapter, for example "Ps 23" */
  whole: boolean;
}

export type ParseResult = { ok: true; passages: Passage[] } | { ok: false; error: string; candidates?: number[] };

const strip = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// alias -> book index, built once
const ALIASES = new Map<string, number>();
const FULL_NAMES: [string, number][] = [];
BOOKS.forEach((b, i) => {
  // "Jud" is ambiguous (Judges or Jude), so Jude's USFM code is not an exact alias
  for (const a of [b.name, b.short, b.osis, b.usfm, b.slug, ...b.aliases]) if (strip(a) !== "jud") ALIASES.set(strip(a), i);
  FULL_NAMES.push([strip(b.name), i]);
});

interface BookMatch {
  book?: number;
  candidates?: number[];
}

function lookup(raw: string): BookMatch {
  const key = strip(raw);
  if (!key) return {};
  const exact = ALIASES.get(key);
  if (exact !== undefined) return { book: exact };
  if (key.length < 2) return {};
  const matches = FULL_NAMES.filter(([n]) => n.startsWith(key)).map(([, i]) => i);
  if (matches.length === 1) return { book: matches[0] };
  if (matches.length > 1) return { candidates: matches };
  const abbr = new Set<number>();
  for (const [a, i] of ALIASES) if (a.startsWith(key)) abbr.add(i);
  if (abbr.size === 1) return { book: [...abbr][0] };
  if (abbr.size > 1) return { candidates: [...abbr] };
  return {};
}

/** Resolve a book name as typed: "jn", "1 Cor", "I John", "First John", "Song of Solomon", "Psalm". */
export function findBook(name: string): BookMatch {
  const t = name.trim().toLowerCase().replace(/\./g, " ").replace(/\s+/g, " ");
  const direct = lookup(t);
  if (direct.book !== undefined) return direct;
  const m = /^(iii|3rd|third|ii|2nd|second|i|1st|first)\s+(.+)$/.exec(t);
  if (m) {
    const n = m[1].startsWith("iii") || m[1] === "3rd" || m[1] === "third" ? 3 : m[1].startsWith("ii") || m[1] === "2nd" || m[1] === "second" ? 2 : 1;
    const hit = lookup(`${n} ${m[2]}`);
    if (hit.book !== undefined || hit.candidates) return hit;
  }
  return direct;
}

const N = "(\\d{1,3})";
const DASH = "\\s*[-\u2013\u2014]\\s*";
const SEP = "\\s*[:.]\\s*";
const RE_CV_CV = new RegExp(`^${N}${SEP}${N}${DASH}${N}${SEP}${N}$`);
const RE_CV = new RegExp(`^${N}${SEP}${N}(?:${DASH}${N})?$`);
const RE_C = new RegExp(`^${N}(?:${DASH}${N})?$`);

/**
 * Parse one or more references: "John 3:16", "Jn 3.16-18", "1 Cor 13", "Phil 4:13; Rom 8:28", "Ps 23:1-3, 5".
 * A segment without a book (the second part of "Rom 8:28; 12:2") reuses the previous book.
 */
export function parseRef(input: string): ParseResult {
  const text = input.trim();
  const hint = "Type a reference such as John 3:16.";
  if (!text) return { ok: false, error: hint };
  const passages: Passage[] = [];
  let prevBook = -1;
  for (const seg of text.split(/\s*;\s*/)) {
    if (!seg.trim()) continue;
    const r = parseSegment(seg.trim(), prevBook);
    if (!r.ok) return r;
    passages.push(...r.passages);
    prevBook = r.passages[r.passages.length - 1].book;
  }
  return passages.length ? { ok: true, passages } : { ok: false, error: hint };
}

function parseSegment(rawSeg: string, prevBook: number): ParseResult {
  const seg = rawSeg.replace(/^([123])(?:st|nd|rd)\b\.?\s*(?=[a-z])/i, "$1 ");
  // name: optional leading digit, then words. Everything from the first digit after the name is the numbers.
  const m = /^(?:([123])\s*)?([a-z][a-z.]*(?:\s+[a-z][a-z.]*)*)\s*(.*)$/i.exec(seg);
  let book = prevBook;
  let rest = seg;
  if (m) {
    const name = `${m[1] ?? ""} ${m[2]}`.trim();
    rest = m[3];
    const hit = findBook(name);
    if (hit.book === undefined) {
      if (hit.candidates) {
        const names = hit.candidates.slice(0, 4).map((i) => BOOKS[i].name);
        return { ok: false, error: `"${name}" could be ${joinOr(names)}. Type a little more of the name.`, candidates: hit.candidates };
      }
      return { ok: false, error: `I do not know a book called "${name}".` };
    }
    book = hit.book;
  } else if (book < 0 || !/^\d/.test(seg)) {
    return { ok: false, error: `I could not read "${seg}". Try a reference such as John 3:16.` };
  }
  rest = rest.replace(/^[.:\s]+/, "");
  const bk = BOOKS[book];
  const chapters = chapterCount(book);
  if (!rest) return { ok: true, passages: [chapterPassage(book, 1, chapters)] };

  const out: Passage[] = [];
  let chapter = 0; // chapter of the previous verse part, so "3:16, 18" works
  for (const part of rest.split(/\s*,\s*/).filter(Boolean)) {
    let mm: RegExpExecArray | null;
    let p: Passage;
    if ((mm = RE_CV_CV.exec(part))) {
      p = { book, c1: +mm[1], v1: +mm[2], c2: +mm[3], v2: +mm[4], whole: false };
    } else if ((mm = RE_CV.exec(part))) {
      p = { book, c1: +mm[1], v1: +mm[2], c2: +mm[1], v2: mm[3] ? +mm[3] : +mm[2], whole: false };
    } else if ((mm = RE_C.exec(part))) {
      const a = +mm[1];
      const b = mm[2] ? +mm[2] : a;
      if (chapters === 1) p = { book, c1: 1, v1: a, c2: 1, v2: b, whole: false };
      else if (chapter > 0 && out.length > 0) p = { book, c1: chapter, v1: a, c2: chapter, v2: b, whole: false };
      else p = chapterPassage(book, a, b);
    } else {
      return { ok: false, error: `I could not read "${part}" in ${bk.name}. Try ${bk.name} 1:1.` };
    }
    const err = validate(p);
    if (err) return { ok: false, error: err };
    chapter = p.whole ? 0 : p.c2;
    out.push(p);
  }
  return { ok: true, passages: out };
}

function chapterPassage(book: number, c1: number, c2: number): Passage {
  return { book, c1, v1: 1, c2, v2: Math.max(1, verseCount(book, c2)), whole: true };
}

function validate(p: Passage): string | null {
  const bk = BOOKS[p.book];
  const n = chapterCount(p.book);
  for (const c of [p.c1, p.c2]) {
    if (c < 1 || c > n) return `${bk.name} has ${n} chapter${n === 1 ? "" : "s"}.`;
  }
  if (p.whole) return p.c2 < p.c1 ? `${bk.name} ${p.c1}-${p.c2} runs backwards.` : null;
  for (const [c, v] of [[p.c1, p.v1], [p.c2, p.v2]] as const) {
    const max = verseCount(p.book, c);
    if (v < 1 || v > max) return `${bk.name} ${c} has ${max} verse${max === 1 ? "" : "s"}.`;
  }
  if (toId(p.book, p.c2, p.v2) < toId(p.book, p.c1, p.v1)) return "That range runs backwards.";
  return null;
}

function joinOr(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " or " + items[items.length - 1];
}

export function passageStartId(p: Passage): number {
  return toId(p.book, p.c1, p.v1);
}
export function passageEndId(p: Passage): number {
  return toId(p.book, p.c2, p.v2);
}

/** "John 3:16", "John 3:16-18", "John 3:16-4:2", "John 3" or "John 3-4" */
export function formatPassage(p: Passage, opts: { short?: boolean } = {}): string {
  const name = opts.short ? BOOKS[p.book].short : BOOKS[p.book].name;
  if (p.whole) {
    if (chapterCount(p.book) === 1) return name;
    return p.c1 === p.c2 ? `${name} ${p.c1}` : `${name} ${p.c1}-${p.c2}`;
  }
  if (chapterCount(p.book) === 1) {
    return p.v1 === p.v2 && p.c1 === p.c2 ? `${name} ${p.v1}` : `${name} ${p.v1}-${p.v2}`;
  }
  if (p.c1 === p.c2) return p.v1 === p.v2 ? `${name} ${p.c1}:${p.v1}` : `${name} ${p.c1}:${p.v1}-${p.v2}`;
  return `${name} ${p.c1}:${p.v1}-${p.c2}:${p.v2}`;
}

/** Format a verse id range, even when it crosses a chapter or a book. */
export function formatRange(startId: number, endId = 0, opts: { short?: boolean } = {}): string {
  const a = fromId(startId);
  if (!endId || endId <= startId) return formatPassage({ book: a.book, c1: a.chapter, v1: a.verse, c2: a.chapter, v2: a.verse, whole: false }, opts);
  const b = fromId(endId);
  if (a.book === b.book) return formatPassage({ book: a.book, c1: a.chapter, v1: a.verse, c2: b.chapter, v2: b.verse, whole: false }, opts);
  const f = (r: { book: number; chapter: number; verse: number }) => formatPassage({ book: r.book, c1: r.chapter, v1: r.verse, c2: r.chapter, v2: r.verse, whole: false }, opts);
  return `${f(a)} to ${f(b)}`;
}

export function formatVerseId(id: number, opts: { short?: boolean } = {}): string {
  return formatRange(id, 0, opts);
}

/** Passage to a verse id range. Whole chapters give the first and last verse. */
export function passageIds(p: Passage): [number, number] {
  return [passageStartId(p), passageEndId(p)];
}

export function isRefLike(input: string): boolean {
  const r = parseRef(input);
  return r.ok;
}

export { isValidRef };
