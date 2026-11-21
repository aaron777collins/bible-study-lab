/** Checks the committed data in public/data/v1 against the invariants in PLAN.md section 2.3. Exits 1 on failure. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { OUT } from "./lib.ts";
import { BOOKS } from "../src/lib/canon/books.ts";
import { VERSE_COUNTS } from "../src/lib/canon/versification.generated.ts";
import { TOTAL_VERSES, idFromOsis, chapterCount, BOOK_START } from "../src/lib/canon/canon.ts";

const errors: string[] = [];
const fail = (m: string) => errors.push(m);
const j = (p: string) => JSON.parse(fs.readFileSync(path.join(OUT, p), "utf8"));
const norm = (s: string) => s.replace(/[-]/g, "");

// Books and chapters
if (BOOKS.length !== 66) fail("expected 66 books");
const chapters = VERSE_COUNTS.reduce((a, b) => a + b.length, 0);
if (chapters !== 1189) fail(`expected 1189 chapters, got ${chapters}`);
if (TOTAL_VERSES !== 31102) fail("expected 31102 verses");

// Text coverage. Allowed differences from KJV numbering are the ones the pipeline reported.
const ALLOWED_VERSE_DIFF: Record<string, string[]> = { web: ["Rom 14", "Rom 16"] };
const manifest = j("manifest.json");
for (const tr of manifest.translations as { id: string; verses: number }[]) {
  let nonEmpty = 0;
  for (const [bi, b] of BOOKS.entries()) {
    const book = j(`text/${tr.id}/${b.osis}.json`) as { c: { v: string[] }[] };
    if (book.c.length !== chapterCount(bi)) fail(`${tr.id} ${b.osis}: ${book.c.length} chapters`);
    book.c.forEach((ch, ci) => {
      const expect = VERSE_COUNTS[bi][ci];
      if (ch.v.length !== expect && !(ALLOWED_VERSE_DIFF[tr.id] ?? []).includes(`${b.osis} ${ci + 1}`)) fail(`${tr.id} ${b.osis} ${ci + 1}: ${ch.v.length} verses, KJV has ${expect}`);
      ch.v.forEach((v, vi) => {
        // Critical texts leave out some verses that the KJV has. Those keep a footnote saying so, so they hold a note anchor.
        if (!norm(v).trim() && !v.includes("\uE006")) fail(`${tr.id}: empty verse ${b.osis} ${ci + 1}:${vi + 1} with no note`);
        if (v.trim()) nonEmpty++;
        if (/\\[a-z]|strong=|\|/.test(v)) fail(`${tr.id} ${b.osis} ${ci + 1}:${vi + 1}: markup left in text`);
      });
    });
  }
  // WEB has 31,103 verse slots because Romans 14 and 16 hold the closing doxology differently
  if (nonEmpty !== tr.verses) fail(`${tr.id}: ${nonEmpty} verse slots, manifest says ${tr.verses}`);
}

// Spot checks
const john = (tr: string) => (j(`text/${tr}/John.json`) as { c: { v: string[] }[] }).c[2].v[15];
if (!norm(john("kjv")).startsWith("For God so loved the world, that he gave his only begotten Son")) fail("KJV John 3:16");
if (!norm(john("web")).startsWith("For God so loved the world, that he gave his only born Son")) fail("WEB John 3:16");
if (!norm(john("asv")).includes("whosoever believeth on him")) fail("ASV John 3:16");
if (!norm(john("ylt")).includes("His Son")) fail("YLT John 3:16");

// Cross references
const xs = j("xref/stats.json");
if (xs.rows !== xs.links + xs.exceptions) fail("xref rows do not add up");
if (xs.rows !== 344799) fail(`xref rows ${xs.rows}, expected 344799`);
if (xs.exceptions > 1) fail(`xref exceptions ${xs.exceptions}, only 1 is allowed`);
let entries = 0;
for (const [bi, b] of BOOKS.entries()) {
  const x = j(`xref/${b.osis}.json`) as Record<string, number[]>;
  for (const [k, flat] of Object.entries(x)) {
    const id = Number(k);
    if (id < BOOK_START[bi] || id >= BOOK_START[bi + 1]) fail(`xref ${b.osis}: id ${id} outside book`);
    if (flat.length % 3) fail(`xref ${b.osis} ${id}: bad triple length`);
    for (let i = 0; i < flat.length; i += 3) {
      entries++;
      const t = flat[i] < 0 ? -flat[i] - 1 : flat[i];
      if (!Number.isInteger(t) || t < 0 || t >= TOTAL_VERSES) fail(`xref ${b.osis} ${id}: bad target ${flat[i]}`);
      if (flat[i + 1] !== 0 && (flat[i + 1] <= t || flat[i + 1] >= TOTAL_VERSES)) fail(`xref ${b.osis} ${id}: bad range end`);
      if (!Number.isInteger(flat[i + 2])) fail(`xref ${b.osis} ${id}: bad votes`);
    }
  }
}
if (entries !== xs.entries) fail(`xref entries ${entries} != ${xs.entries}`);
const gen11 = (j("xref/Gen.json") as Record<string, number[]>)["0"];
const ps83 = idFromOsis("Ps.8.3");
let found = false;
for (let i = 0; i < gen11.length; i += 3) if (gen11[i] === ps83 && gen11[i + 2] === 77) found = true;
if (!found) fail("Gen 1:1 to Ps 8:3 should have 77 votes");
const edges = fs.statSync(path.join(OUT, "xref/edges5.bin")).size;
if (edges !== xs.edges5 * 6) fail("edges5.bin size does not match its link count");

// Strong's
const ss = j("strongs/stats.json");
if (ss.missing !== 0) fail(`${ss.missing} KJV Strong's numbers have no lexicon entry`);
const g26 = j("strongs/lex/G0.json").G26;
if (!g26 || g26[1] !== "agápē") fail("lexicon G26");
const kjvJohn = j("strongs/kjv/John.json") as { c: (string | [string, string])[][][] };
const tagged = kjvJohn.c[2][15].filter((p) => Array.isArray(p)) as [string, string][];
if (!tagged.some(([w, n]) => w === "loved" && n === "G25")) fail("KJV John 3:16 should tag loved as G25");

// Topics, verse of the day
const topics = j("topics/index.json") as [string, string, number][];
if (topics.length < 6000) fail("too few topics");
const votd = j("votd.json") as number[];
if (votd.length !== 366 || new Set(votd).size !== 366 || votd.some((v) => v < 0 || v >= TOTAL_VERSES)) fail("votd must be 366 distinct verses");

// Reading plans
const planIndex = j("plans/index.json") as { id: string; days: number }[];
for (const p of planIndex) {
  const plan = j(`plans/${p.id}.json`) as { days: number[][][] };
  if (plan.days.length !== p.days) fail(`plan ${p.id}: day count`);
  const count = new Map<number, number>();
  for (const day of plan.days) {
    if (!day.length) fail(`plan ${p.id}: empty day`);
    for (const [b, c1, c2, v1] of day) {
      if (c1 < 1 || c2 > chapterCount(b)) fail(`plan ${p.id}: bad range`);
      if (v1 === undefined) for (let c = c1; c <= c2; c++) count.set(b * 1000 + c, (count.get(b * 1000 + c) ?? 0) + 1);
    }
  }
  if (p.id === "mcheyne") {
    if (plan.days.length !== 365 || plan.days.some((d) => d.length !== 4)) fail("mcheyne: 365 days of 4 readings");
    for (const [bi] of BOOKS.entries()) {
      for (let c = 1; c <= chapterCount(bi); c++) {
        // Luke 1, Psalm 78 and Psalm 119 are split by verse, so count them as one reading
        const expected = bi >= 39 || bi === 18 ? 2 : 1;
        const got = count.get(bi * 1000 + c) ?? 0;
        const split = (bi === 41 && c === 1) || (bi === 18 && (c === 78 || c === 119));
        if (!split && got !== expected) fail(`mcheyne: book ${bi} chapter ${c} read ${got} times, expected ${expected}`);
      }
    }
  }
  if (p.id === "bible-in-a-year") {
    for (const [bi] of BOOKS.entries()) for (let c = 1; c <= chapterCount(bi); c++) if (count.get(bi * 1000 + c) !== 1) fail(`bible-in-a-year: ${bi} ${c}`);
  }
}

// Size budgets
let total = 0;
const walk = (dir: string) => {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else {
      total += st.size;
      const gz = zlib.gzipSync(fs.readFileSync(full)).length;
      const limit = f.endsWith(".bin") ? 500_000 : 300_000;
      if (gz > limit) fail(`${path.relative(OUT, full)} is ${gz} bytes gzipped, over ${limit}`);
    }
  }
};
walk(OUT);
if (total > 50_000_000) fail(`public/data is ${total} bytes, over 50 MB`);

if (errors.length) {
  console.error(`data:verify FAILED with ${errors.length} problem(s):`);
  for (const e of errors.slice(0, 40)) console.error("  - " + e);
  process.exit(1);
}
console.log(`data:verify ok: ${chapters} chapters, ${TOTAL_VERSES} verses, ${xs.links} cross references, ${(total / 1e6).toFixed(1)} MB`);
