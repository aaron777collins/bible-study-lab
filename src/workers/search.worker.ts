/// <reference lib="webworker" />
import { expose } from "comlink";
import MiniSearch from "minisearch";
import { BOOKS } from "@/lib/canon/books";
import { BOOK_START, TOTAL_VERSES, isValidRef, toId } from "@/lib/canon/canon";
import { normalize, tokenize } from "@/lib/search/query";

interface Doc {
  id: number;
  t: string;
}
interface Index {
  ms: MiniSearch<Doc>;
  texts: string[];
  norm: string[];
}
const indexes = new Map<string, Promise<Index>>();

async function build(base: string, tr: string): Promise<Index> {
  const texts = new Array<string>(TOTAL_VERSES).fill("");
  await Promise.all(
    BOOKS.map(async (b, bi) => {
      const res = await fetch(`${base}text/${tr}/${b.osis}.json`);
      if (!res.ok) throw new Error(`Could not load ${b.name} (${res.status})`);
      const j = (await res.json()) as { c: { v: string[] }[] };
      j.c.forEach((ch, ci) => {
        ch.v.forEach((v, vi) => {
          const clean = v.replace(/[-]/g, "").replace(/\s+/g, " ").trim();
          // only verses that exist in KJV numbering get an id
          if (isValidRef(bi, ci + 1, vi + 1)) texts[toId(bi, ci + 1, vi + 1)] = clean;
        });
      });
    }),
  );
  const norm = texts.map((t) => normalize(t));
  const ms = new MiniSearch<Doc>({
    fields: ["t"],
    idField: "id",
    storeFields: [],
    tokenize,
    searchOptions: { prefix: true, combineWith: "AND", boost: { t: 1 } },
  });
  ms.addAll(norm.map((t, id) => ({ id, t })).filter((d) => d.t));
  return { ms, texts, norm };
}

export interface SearchRequest {
  base: string;
  tr: string;
  words: string[];
  phrases: string[];
  /** "all", "ot", "nt" or a book OSIS id */
  scope: string;
  limit: number;
}
export interface SearchResponse {
  total: number;
  byBook: number[];
  hits: { id: number; text: string }[];
  ms: number;
}

function inScope(id: number, scope: string): boolean {
  if (scope === "all") return true;
  if (scope === "ot") return id < BOOK_START[39];
  if (scope === "nt") return id >= BOOK_START[39];
  const bi = BOOKS.findIndex((b) => b.osis === scope);
  return bi >= 0 && id >= BOOK_START[bi] && id < BOOK_START[bi + 1];
}

const api = {
  async ready(base: string, tr: string): Promise<void> {
    if (!indexes.has(tr)) {
      const p = build(base, tr);
      indexes.set(tr, p);
      p.catch(() => indexes.delete(tr));
    }
    await indexes.get(tr);
  },
  async search(req: SearchRequest): Promise<SearchResponse> {
    const t0 = performance.now();
    await api.ready(req.base, req.tr);
    const idx = await indexes.get(req.tr)!;
    let ids: number[];
    const terms = [...req.words, ...req.phrases.flatMap((p) => p.split(" "))];
    if (terms.length === 0) return { total: 0, byBook: new Array(66).fill(0), hits: [], ms: 0 };
    const results = idx.ms.search(terms.join(" "), { prefix: true, combineWith: "AND", fuzzy: (term) => (term.length >= 6 ? 0.12 : false) });
    ids = results.map((r) => r.id as number);
    // exact matches rank first: if there are enough, drop fuzzy-only hits
    if (req.phrases.length) {
      ids = ids.filter((id) => req.phrases.every((p) => ` ${idx.norm[id]} `.includes(` ${p} `) || ` ${idx.norm[id]} `.includes(` ${p}`)));
    }
    ids = ids.filter((id) => inScope(id, req.scope));
    const byBook = new Array(66).fill(0) as number[];
    for (const id of ids) {
      let lo = 0;
      let hi = 65;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (BOOK_START[mid] <= id) lo = mid;
        else hi = mid - 1;
      }
      byBook[lo]++;
    }
    const total = ids.length;
    const top = ids.slice(0, req.limit).sort((a, b) => a - b);
    return { total, byBook, hits: top.map((id) => ({ id, text: idx.texts[id] })), ms: Math.round(performance.now() - t0) };
  },
};
export type SearchApi = typeof api;
expose(api);
