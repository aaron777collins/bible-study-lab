/** Word counts, top words and distinctive words per book, per translation. */
import fs from "node:fs";
import path from "node:path";
import { OUT, TRANSLATIONS, allBooks, writeJson } from "./lib.ts";

const STOP = new Set(
  "a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself let me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up us very was we were what when where which while who whom why will with would you your yours yourself yourselves unto thou thee thy thine ye hath doth shall shalt art wilt hast saith said say lo yea nay o oh also upon thereof therefore wherefore hath neither whose whosoever whoso".split(" "),
);
const MARK = /[-]/g;
const tokenize = (s: string) =>
  s
    .replace(MARK, "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];

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
    const top = [...m].filter(([w]) => !STOP.has(w) && w.length > 2).sort((a, c) => c[1] - a[1] || a[0].localeCompare(c[0])).slice(0, 30);
    const minCount = total[i] < 5000 ? 3 : 5;
    const distinct = [...m]
      .filter(([w, c]) => !STOP.has(w) && w.length > 2 && c >= minCount)
      .map(([w, c]) => [w, c, (c / total[i]) * Math.log(66 / (df.get(w) ?? 1))] as [string, number, number])
      .sort((a, c) => c[2] - a[2] || a[0].localeCompare(c[0]))
      .slice(0, 20)
      .map(([w, c, s]) => [w, c, Math.round(s * 1e6) / 100]);
    (result[b.osis] ??= {})[tr.id] = { words: total[i], verses: verses[i], chapterWords: chapterWords[i], top, distinct };
  });
  bibleTop[tr.id] = {
    words: bibleTotal,
    unique: bible.size,
    top: [...bible].filter(([w]) => !STOP.has(w) && w.length > 2).sort((a, c) => c[1] - a[1] || a[0].localeCompare(c[0])).slice(0, 60),
  };
}
for (const [osis, v] of Object.entries(result)) writeJson(path.join(OUT, "insights", `${osis}.json`), v);
writeJson(path.join(OUT, "insights", "bible.json"), bibleTop);
console.log("insights: written for", Object.keys(result).length, "books");
