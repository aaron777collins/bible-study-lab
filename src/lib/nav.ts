import { BOOKS } from "./canon/books";
import { formatPassage, passageStartId, type Passage } from "./canon/parse";
import { fromId } from "./canon/canon";

export const readPath = (book: number, chapter = 1, query = "") => `/read/${BOOKS[book].slug}/${chapter}${query}`;

/** Link to a chapter with a verse range selected. */
export function passagePath(p: Passage, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams(extra);
  if (!p.whole) q.set("v", p.v1 === p.v2 && p.c1 === p.c2 ? String(p.v1) : p.c1 === p.c2 ? `${p.v1}-${p.v2}` : `${p.v1}-${p.v2}`);
  const s = q.toString();
  return readPath(p.book, p.c1, s ? `?${s}` : "");
}

export function versePath(id: number, extra: Record<string, string> = {}): string {
  const r = fromId(id);
  const q = new URLSearchParams({ v: String(r.verse), ...extra }).toString();
  return readPath(r.book, r.chapter, `?${q}`);
}

/** The connections page for a verse. */
export function connectionsPath(id: number, query = ""): string {
  const r = fromId(id);
  return `/verse/${BOOKS[r.book].slug}/${r.chapter}/${r.verse}${query}`;
}

export function passageLabel(p: Passage): string {
  return formatPassage(p);
}
export { passageStartId };
