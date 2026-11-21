import { parseRef, type Passage } from "@/lib/canon/parse";

export interface ParsedQuery {
  /** the verse reference the whole query means, if any */
  reference: Passage | null;
  /** Strong's number such as G26 */
  strongs: string | null;
  /** words to match, lower case */
  words: string[];
  /** quoted phrases, lower case and normalized */
  phrases: string[];
}

/** Lower case, straight apostrophes, no punctuation. Used for both the index and the query so they agree. */
export function normalize(text: string): string {
  return text
    .replace(/[-]/g, "")
    .toLowerCase()
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]+/gu, " ")
    .replace(/(^|\s)'+|'+(?=\s|$)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}

export function parseQuery(input: string): ParsedQuery {
  const q = input.trim();
  const out: ParsedQuery = { reference: null, strongs: null, words: [], phrases: [] };
  if (!q) return out;
  const s = /^([GHgh])\s?(\d{1,4})$/.exec(q);
  if (s) out.strongs = `${s[1].toUpperCase()}${Number(s[2])}`;
  // references: must contain a digit, otherwise a book name alone would hijack word searches such as "John"
  if (/\d/.test(q) && !q.includes('"')) {
    const r = parseRef(q);
    if (r.ok) out.reference = r.passages[0];
  }
  const rest = q.replace(/"([^"]+)"/g, (_, p: string) => {
    const n = normalize(p);
    if (n) out.phrases.push(n);
    return " ";
  });
  out.words = tokenize(rest);
  return out;
}

/** Split text into pieces so the matching words can be wrapped. Matches are whole word starts (prefix), like the search. */
export function highlightPieces(text: string, terms: string[]): { t: string; hit: boolean }[] {
  const clean = terms.filter(Boolean);
  if (!clean.length) return [{ t: text, hit: false }];
  const phraseRe = clean.map((t) => t.split(" ").map(escapeRe).join("[^\\p{L}\\p{N}']+")).join("|");
  const re = new RegExp(`(?<![\\p{L}\\p{N}'])(?:${phraseRe})`, "giu");
  const pieces: { t: string; hit: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0;
    // extend to the end of the word so prefix matches highlight the whole word
    const tail = /^[\p{L}\p{N}']*/u.exec(text.slice(idx + m[0].length))?.[0] ?? "";
    if (idx > last) pieces.push({ t: text.slice(last, idx), hit: false });
    pieces.push({ t: m[0] + tail, hit: true });
    last = idx + m[0].length + tail.length;
  }
  if (last < text.length) pieces.push({ t: text.slice(last), hit: false });
  return pieces;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
