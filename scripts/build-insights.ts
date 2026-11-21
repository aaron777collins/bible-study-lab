/** Word counts, top words and distinctive words per book, per translation. */
import fs from "node:fs";
import path from "node:path";
import { OUT, TRANSLATIONS, allBooks, writeJson } from "./lib.ts";
import { distinctiveWords, tokenize, topWords } from "./insights-math.ts";

fs.rmSync(path.join(OUT, "insights"), { recursive: true, force: true });
const books = allBooks();
const perTr: Record<string, { counts: Map<string, number>[]; chapterWords: number[][]; verses: number[]; total: number[] }> = {};
for (const tr of TRANSLATIONS) {
  const counts: Map<string, number>[] = [];
  const chapterWords: number[][] = [];
  const verses: number[] = [];
  const total: number[] = [];
  for (const b of books) {
    const j = JSON.parse(fs.readFileSync(path.join(OUT, "text", tr.id, `${b.osis}.json`), "utf8")) as { c: { v: string[] }[] };
    const m = new Map<string, number>();
    const cw: number[] = [];
    let n = 0;
    let vcount = 0;
    for (const ch of j.c) {
      let w = 0;
      for (const v of ch.v) {
        if (v) vcount++;
        for (const t of tokenize(v)) {
          m.set(t, (m.get(t) ?? 0) + 1);
          w++;
        }
      }
      cw.push(w);
      n += w;
    }
    counts.push(m);
    chapterWords.push(cw);
    verses.push(vcount);
    total.push(n);
  }
  perTr[tr.id] = { counts, chapterWords, verses, total };
}

const result: Record<string, Record<string, unknown>> = {};
const bibleTop: Record<string, unknown> = {};
for (const tr of TRANSLATIONS) {
  const { counts, chapterWords, verses, total } = perTr[tr.id];
  const df = new Map<string, number>();
  const bible = new Map<string, number>();
  for (const m of counts) for (const [w, c] of m) {
    df.set(w, (df.get(w) ?? 0) + 1);
    bible.set(w, (bible.get(w) ?? 0) + c);
  }
  const bibleTotal = total.reduce((a, c) => a + c, 0);
  books.forEach((b, i) => {
    const m = counts[i];
    const top = topWords(m, 30);
    const distinct = distinctiveWords(m, total[i], df, 66, total[i] < 5000 ? 3 : 5);
    (result[b.osis] ??= {})[tr.id] = { words: total[i], verses: verses[i], chapterWords: chapterWords[i], top, distinct };
  });
  bibleTop[tr.id] = {
    words: bibleTotal,
    unique: bible.size,
    top: topWords(bible, 60),
  };
}
for (const [osis, v] of Object.entries(result)) writeJson(path.join(OUT, "insights", `${osis}.json`), v);
writeJson(path.join(OUT, "insights", "bible.json"), bibleTop);
console.log("insights: written for", Object.keys(result).length, "books");
