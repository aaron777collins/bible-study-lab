/** Translations to per-book JSON in public/data/v1/text/{tr}/{Book}.json (+ .notes.json). */
import fs from "node:fs";
import path from "node:path";
import { OUT, TRANSLATIONS, allBooks, readUsfmBook, report, writeJson } from "./lib.ts";
import { normalizePieces, piecesToText } from "./usfm.ts";
import { VERSE_COUNTS } from "../src/lib/canon/versification.generated.ts";

const lines: string[] = ["Versification report: differences from KJV numbering (chapter:verse counts)", ""];
fs.rmSync(path.join(OUT, "text"), { recursive: true, force: true });
const stats: Record<string, { verses: number }> = {};

for (const tr of TRANSLATIONS) {
  let verses = 0;
  const warn: string[] = [];
  for (const b of allBooks()) {
    const parsed = readUsfmBook(tr.dir, b.usfm);
    for (const w of parsed.warnings) warn.push(`${b.osis}: ${w}`);
    const chapters: { v: string[]; p?: number[]; q?: number[]; t?: string }[] = [];
    const notes: [number, number, string[]][] = [];
    const chNums = [...parsed.chapters.keys()].sort((a, c) => a - c);
    if (chNums.length !== VERSE_COUNTS[b.index].length) warn.push(`${b.osis}: ${chNums.length} chapters, KJV has ${VERSE_COUNTS[b.index].length}`);
    for (const cn of chNums) {
      const ch = parsed.chapters.get(cn)!;
      const maxV = Math.max(0, ...ch.verses.keys());
      const kjvCount = VERSE_COUNTS[b.index][cn - 1];
      if (kjvCount !== undefined && maxV !== kjvCount) warn.push(`${b.osis} ${cn}: ${maxV} verses, KJV has ${kjvCount}`);
      const v: string[] = [];
      const p: number[] = [];
      const q: number[] = [];
      for (let n = 1; n <= maxV; n++) {
        const pv = ch.verses.get(n);
        if (!pv) {
          v.push("");
          warn.push(`${b.osis} ${cn}:${n} missing in ${tr.id}`);
          continue;
        }
        const text = piecesToText(normalizePieces(pv.pieces));
        v.push(text.replace(/\s+/g, " ").trim());
        if (text.trim()) verses++;
        if (pv.paraStart) p.push(n);
        if (pv.poetry) q.push(n);
        if (pv.notes.length) notes.push([cn, n, pv.notes]);
      }
      const o: { v: string[]; p?: number[]; q?: number[]; t?: string } = { v };
      if (ch.title) o.t = ch.title;
      if (p.length) o.p = p;
      if (q.length) o.q = q;
      chapters.push(o);
    }
    writeJson(path.join(OUT, "text", tr.id, `${b.osis}.json`), { c: chapters });
    if (notes.length) writeJson(path.join(OUT, "text", tr.id, `${b.osis}.notes.json`), notes);
  }
  stats[tr.id] = { verses };
  lines.push(`== ${tr.id}: ${verses} non-empty verses`, ...warn.map((w) => "  " + w), "");
  console.log(tr.id, verses, "verses,", warn.length, "notes in report");
}
report("versification-report.txt", lines);
writeJson(path.join(OUT, "translations.json"), TRANSLATIONS.map(({ id, name, short }) => ({ id, name, short, verses: stats[id].verses })));
