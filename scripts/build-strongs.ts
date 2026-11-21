/** KJV tokens with Strong's numbers, the lexicon (CC BY-SA, Open Scriptures) and the concordance. */
import fs from "node:fs";
import path from "node:path";
import { OUT, RAW, TRANSLATIONS, allBooks, readUsfmBook, report, writeJson } from "./lib.ts";
import { normalizePieces, type Piece } from "./usfm.ts";
import { toId } from "../src/lib/canon/canon.ts";

const kjv = TRANSLATIONS[0];
fs.rmSync(path.join(OUT, "strongs"), { recursive: true, force: true });

// 1. KJV tokens and concordance
const occ = new Map<string, Set<number>>(); // number -> verse ids
const renders = new Map<string, Map<string, number>>(); // number -> english word -> count
const tagCount = new Map<string, number>();
let tags = 0;
for (const b of allBooks()) {
  const parsed = readUsfmBook(kjv.dir, b.usfm);
  const chs: Piece[][][] = [];
  for (const cn of [...parsed.chapters.keys()].sort((a, c) => a - c)) {
    const ch = parsed.chapters.get(cn)!;
    const vs: Piece[][] = [];
    for (const vn of [...ch.verses.keys()].sort((a, c) => a - c)) {
      const pv = ch.verses.get(vn)!;
      const pieces = normalizePieces(pv.pieces);
      vs.push(pieces);
      const id = toId(b.index, cn, vn);
      for (const p of pieces) {
        if (typeof p === "string") continue;
        tags++;
        const [word, num] = p;
        tagCount.set(num, (tagCount.get(num) ?? 0) + 1);
        let set = occ.get(num);
        if (!set) occ.set(num, (set = new Set()));
        set.add(id);
        const w = word.toLowerCase().replace(/[^a-z'\- ]/g, "").trim();
        if (w) {
          let m = renders.get(num);
          if (!m) renders.set(num, (m = new Map()));
          m.set(w, (m.get(w) ?? 0) + 1);
        }
      }
    }
    chs.push(vs);
  }
  writeJson(path.join(OUT, "strongs", "kjv", `${b.osis}.json`), { c: chs });
}
console.log(`strongs: ${tags} tags, ${occ.size} distinct numbers`);

// 2. Lexicon
function loadLex(file: string): Record<string, Record<string, string>> {
  const src = fs.readFileSync(path.join(RAW, file), "utf8");
  const start = src.indexOf("{", src.indexOf("= "));
  const end = src.lastIndexOf("}");
  return JSON.parse(src.slice(start, end + 1));
}
const lex: Record<string, Record<string, string>> = { ...loadLex("strongs-greek-dictionary.js"), ...loadLex("strongs-hebrew-dictionary.js") };
const buckets = new Map<string, Record<string, string[]>>();
const missing: string[] = [];
const bucketOf = (num: string) => `${num[0]}${Math.floor(Number(num.slice(1)) / 500)}`;
for (const [num, e] of Object.entries(lex)) {
  const key = bucketOf(num);
  let obj = buckets.get(key);
  if (!obj) buckets.set(key, (obj = {}));
  obj[num] = [e.lemma ?? "", e.translit ?? e.xlit ?? "", e.pron ?? "", (e.derivation ?? "").trim(), (e.strongs_def ?? "").trim(), (e.kjv_def ?? "").trim()];
}
for (const [key, obj] of buckets) writeJson(path.join(OUT, "strongs", "lex", `${key}.json`), obj);
for (const num of occ.keys()) if (!lex[num]) missing.push(num);
report("strongs-missing.txt", ["KJV Strong's numbers with no lexicon entry (allowed by verify-data):", ...missing.sort()]);

// 3. Concordance: delta encoded verse ids and the top English renderings
const occBuckets = new Map<string, Record<string, unknown>>();
for (const [num, set] of occ) {
  const ids = [...set].sort((a, b) => a - b);
  const deltas = ids.map((id, i) => (i === 0 ? id : id - ids[i - 1]));
  const r = [...(renders.get(num) ?? [])].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
  const key = bucketOf(num);
  let obj = occBuckets.get(key);
  if (!obj) occBuckets.set(key, (obj = {}));
  obj[num] = { n: tagCount.get(num), v: deltas, r };
}
for (const [key, obj] of occBuckets) writeJson(path.join(OUT, "strongs", "occ", `${key}.json`), obj);
writeJson(path.join(OUT, "strongs", "stats.json"), { tags, numbers: occ.size, missing: missing.length });
console.log(`strongs: lexicon ${Object.keys(lex).length} entries, ${missing.length} tagged numbers missing`);

fs.writeFileSync(
  path.join(OUT, "strongs", "lex", "LICENSE.txt"),
  `These lexicon files are derived from the Open Scriptures Strong's dictionaries
(https://github.com/openscriptures/strongs), which carry this notice:
  Greek: "Copyright 2009, Open Scriptures. CC-BY-SA. Derived from XML."
  Hebrew: "Copyright 2010, Open Scriptures. CC-BY-SA."
The underlying text is Strong's Exhaustive Concordance (James Strong, 1890 and 1894), in the public domain.
The XML edition was prepared by Ulrik Petersen (Greek) and by David Troidl and others (Hebrew).
These files are therefore shared under Creative Commons Attribution-ShareAlike (CC BY-SA 3.0):
https://creativecommons.org/licenses/by-sa/3.0/
The rest of this app is released under the MIT license.
`,
);
