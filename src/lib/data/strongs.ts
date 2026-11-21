import { BOOKS } from "@/lib/canon/books";
import { getJson } from "./load";
import type { Token } from "@/components/reader/ChapterView";

export type LexEntry = [lemma: string, translit: string, pron: string, derivation: string, strongsDef: string, kjvDef: string];
export interface OccEntry {
  /** tagged words in the KJV */
  n: number;
  /** delta encoded verse ids */
  v: number[];
  /** [english word, count], most common first */
  r: [string, number][];
}

export const STRONG_RE = /^([GH])(\d{1,4})$/;
export const isStrongsId = (s: string) => STRONG_RE.test(s);

const bucket = (num: string) => `${num[0]}${Math.floor(Number(num.slice(1)) / 500)}`;

export async function loadLex(num: string): Promise<LexEntry | undefined> {
  const b = await getJson<Record<string, LexEntry>>(`strongs/lex/${bucket(num)}.json`);
  return b[num];
}
export async function loadOcc(num: string): Promise<OccEntry | undefined> {
  const b = await getJson<Record<string, OccEntry>>(`strongs/occ/${bucket(num)}.json`);
  return b[num];
}
export function decodeDeltas(v: number[]): number[] {
  const out: number[] = [];
  let id = 0;
  v.forEach((d, i) => {
    id = i === 0 ? d : id + d;
    out.push(id);
  });
  return out;
}

export const loadKjvTokens = (book: number) => getJson<{ c: Token[][][] }>(`strongs/kjv/${BOOKS[book].osis}.json`);

export const strongsLanguage = (num: string) => (num[0] === "H" ? "Hebrew" : "Greek");
