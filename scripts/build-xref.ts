/** Cross references (OpenBible, CC BY 4.0) to per-book files, a graph file and summaries. */
import fs from "node:fs";
import path from "node:path";
import { OUT, RAW, report, writeJson } from "./lib.ts";
import { BOOKS } from "../src/lib/canon/books.ts";
import { BOOK_START, CHAPTER_START, TOTAL_VERSES, bookOfId, fromId, idFromOsis, chapterCount } from "../src/lib/canon/canon.ts";

/** Ranges longer than this are only listed as "referenced by" on their first verse. */
const MAX_RANGE_FANOUT = 12;

const file = path.join(RAW, "cross-references", "cross_references.txt");
const rows = fs.readFileSync(file, "utf8").split("\n").filter((l) => l && !l.startsWith("From Verse") && !l.startsWith("#"));

interface Link {
  from: number;
  to: number;
  end: number; // 0 when the target is one verse
  votes: number;
}
const links: Link[] = [];
const exceptions: string[] = [];
for (const row of rows) {
  const [a, b, v] = row.split("\t");
  const votes = Number(v);
  const from = idFromOsis(a);
  const [t0, t1] = b.split("-");
  const to = idFromOsis(t0);
  // A few ranges end one verse past the KJV chapter (3 John 1:15); clamp them to the last KJV verse.
  let end = t1 ? idFromOsis(t1, true) : 0;
  if (from < 0 || to < 0 || (t1 && end < 0) || !Number.isInteger(votes)) {
    exceptions.push(row);
    continue;
  }
  if (end !== 0 && end <= to) end = 0;
  links.push({ from, to, end, votes });
}
console.log(`xref: ${rows.length} rows, ${links.length} usable, ${exceptions.length} exceptions`);
report("xref-exceptions.txt", ["Cross reference rows that do not resolve to a KJV verse (allowed by verify-data):", ...exceptions]);

// per verse lists
const lists: Map<number, number[][]> = new Map();
const push = (id: number, t: number, e: number, v: number) => {
  let l = lists.get(id);
  if (!l) lists.set(id, (l = []));
  l.push([t, e, v]);
};
for (const l of links) {
  push(l.from, l.to, l.end, l.votes);
  // "referenced by": stored on the target verse(s) with a negative source marker
  const last = l.end && l.end - l.to + 1 <= MAX_RANGE_FANOUT ? l.end : l.to;
  for (let id = l.to; id <= last; id++) push(id, -(l.from + 1), 0, l.votes);
}

fs.rmSync(path.join(OUT, "xref"), { recursive: true, force: true });
let entries = 0;
BOOKS.forEach((b, bi) => {
  const obj: Record<string, number[]> = {};
  for (let id = BOOK_START[bi]; id < BOOK_START[bi + 1]; id++) {
    const l = lists.get(id);
    if (!l) continue;
    // votes desc, then canonical order of the other verse
    l.sort((x, y) => y[2] - x[2] || Math.abs(x[0]) - Math.abs(y[0]) || x[1] - y[1]);
    obj[id] = l.flat();
    entries += l.length;
  }
  writeJson(path.join(OUT, "xref", `${b.osis}.json`), obj);
});

// graph: every link with 5 or more votes, as Uint16 triples (from, to start, votes)
const strong = links.filter((l) => l.votes >= 5);
const buf = new Uint16Array(strong.length * 3);
strong.forEach((l, i) => {
  buf[i * 3] = l.from;
  buf[i * 3 + 1] = l.to;
  buf[i * 3 + 2] = Math.min(l.votes, 65535);
});
fs.mkdirSync(path.join(OUT, "xref"), { recursive: true });
fs.writeFileSync(path.join(OUT, "xref", "edges5.bin"), Buffer.from(buf.buffer));

// summaries
const weight = new Float64Array(TOTAL_VERSES);
const count = new Uint32Array(TOTAL_VERSES);
const bookOut = new Array(66).fill(0);
const bookIn = new Array(66).fill(0);
const matrix: number[] = new Array(66 * 66).fill(0);
const matrixCount: number[] = new Array(66 * 66).fill(0);
for (const l of links) {
  if (l.votes <= 0) continue;
  const fb = bookOfId(l.from);
  const tb = bookOfId(l.to);
  bookOut[fb] += l.votes;
  bookIn[tb] += l.votes;
  matrix[fb * 66 + tb] += l.votes;
  matrixCount[fb * 66 + tb] += 1;
  weight[l.from] += l.votes;
  count[l.from] += 1;
  const last = l.end && l.end - l.to + 1 <= MAX_RANGE_FANOUT ? l.end : l.to;
  for (let id = l.to; id <= last; id++) {
    weight[id] += l.votes;
    count[id] += 1;
  }
}
const ids = Array.from({ length: TOTAL_VERSES }, (_, i) => i);
const topWeight = ids.sort((a, b) => weight[b] - weight[a] || a - b).slice(0, 1000).map((id) => [id, weight[id], count[id]]);
const topCount = [...ids].sort((a, b) => count[b] - count[a] || a - b).slice(0, 200).map((id) => [id, weight[id], count[id]]);
const chapterWeight: number[][] = BOOKS.map((_, bi) => CHAPTER_START[bi].map(() => 0));
for (let id = 0; id < TOTAL_VERSES; id++) {
  const r = fromId(id);
  chapterWeight[r.book][r.chapter - 1] += weight[id];
}
// distinct verses with any link
let linkedVerses = 0;
for (let i = 0; i < TOTAL_VERSES; i++) if (count[i] > 0) linkedVerses++;
writeJson(path.join(OUT, "xref", "summary.json"), {
  totalLinks: links.length,
  positiveLinks: links.filter((l) => l.votes > 0).length,
  linkedVerses,
  topWeight,
  topCount,
  bookOut,
  bookIn,
  matrix,
  matrixCount,
  chapterWeight,
});
writeJson(path.join(OUT, "xref", "stats.json"), {
  rows: rows.length,
  exceptions: exceptions.length,
  links: links.length,
  edges5: strong.length,
  entries,
});
console.log(`xref: ${entries} list entries, ${strong.length} strong edges, ${chapterCount(0)} (sanity)`);
