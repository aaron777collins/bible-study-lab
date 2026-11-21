/** Reading plans. Each day is a list of chapter ranges [bookIndex, firstChapter, lastChapter]. */
import fs from "node:fs";
import path from "node:path";
import { OUT, writeJson } from "./lib.ts";
import { ALL_CHAPTERS, chapterCount, verseCount } from "../src/lib/canon/canon.ts";
import { BOOKS } from "../src/lib/canon/books.ts";
import mcheyne from "./plans/mcheyne.json" with { type: "json" };

/** [book index, first chapter, last chapter, first verse?, last verse?] */
type Range = [number, number, number] | [number, number, number, number, number];
interface Plan {
  id: string;
  name: string;
  description: string;
  days: Range[][];
}

const refsOf = (chs: { book: number; chapter: number }[]): Range[] => {
  const out: Range[] = [];
  for (const c of chs) {
    const last = out[out.length - 1];
    if (last && last[0] === c.book && last[2] === c.chapter - 1) last[2] = c.chapter;
    else out.push([c.book, c.chapter, c.chapter]);
  }
  return out;
};

/** Split an ordered list of chapters into N non-empty days with similar verse counts. */
function balance(chs: { book: number; chapter: number }[], days: number): Range[][] {
  const weights = chs.map((c) => verseCount(c.book, c.chapter));
  let remainingVerses = weights.reduce((a, b) => a + b, 0);
  const out: Range[][] = [];
  let i = 0;
  for (let d = 0; d < days; d++) {
    const daysLeft = days - d;
    const target = remainingVerses / daysLeft;
    const group: { book: number; chapter: number }[] = [];
    let sum = 0;
    while (i < chs.length) {
      const chaptersLeftAfter = chs.length - i - 1;
      if (group.length === 0) {
        group.push(chs[i]);
        sum += weights[i];
        i++;
        continue;
      }
      if (daysLeft === 1) {
        group.push(chs[i]);
        sum += weights[i];
        i++;
        continue;
      }
      // keep enough chapters for the days that follow
      if (chaptersLeftAfter + 1 <= daysLeft - 1) break;
      if (Math.abs(sum + weights[i] - target) < Math.abs(sum - target)) {
        group.push(chs[i]);
        sum += weights[i];
        i++;
      } else break;
    }
    remainingVerses -= sum;
    out.push(refsOf(group));
  }
  return out;
}

const bookRange = (from: number, to: number) => ALL_CHAPTERS.filter((c) => c.book >= from && c.book <= to);
const idx = (osis: string) => BOOKS.findIndex((b) => b.osis === osis);

const plans: Plan[] = [];
plans.push({
  id: "bible-in-a-year",
  name: "Whole Bible in a year",
  description: "Every chapter from Genesis to Revelation in order, about 85 verses a day.",
  days: balance(ALL_CHAPTERS, 365),
});
plans.push({
  id: "new-testament-90",
  name: "New Testament in 90 days",
  description: "Matthew to Revelation in three months, about 90 verses a day.",
  days: balance(bookRange(idx("Matt"), idx("Rev")), 90),
});
plans.push({
  id: "gospels-40",
  name: "The four Gospels in 40 days",
  description: "Matthew, Mark, Luke and John in forty days: get to know Jesus.",
  days: balance(bookRange(idx("Matt"), idx("John")), 40),
});
plans.push({
  id: "john-21",
  name: "John in 21 days",
  description: "One chapter of John a day. A good first plan for a new reader.",
  days: balance(bookRange(idx("John"), idx("John")), 21),
});
plans.push({
  id: "paul-30",
  name: "Paul's letters in 30 days",
  description: "Romans to Philemon in a month.",
  days: balance(bookRange(idx("Rom"), idx("Phlm")), 30),
});
{
  const ps = idx("Ps");
  const pr = idx("Prov");
  const days: Range[][] = [];
  for (let d = 1; d <= 31; d++) {
    const day: Range[] = [];
    if (d <= 30) day.push([ps, (d - 1) * 5 + 1, d * 5]);
    day.push([pr, d, d]);
    days.push(day);
  }
  plans.push({
    id: "psalms-proverbs-31",
    name: "Psalms and Proverbs in a month",
    description: "Five psalms and one chapter of Proverbs a day, for prayer and wisdom.",
    days,
  });
}

{
  const alias: Record<string, string> = { psalm: "ps", songofsongs: "song", "1thes": "1thess", "2thes": "2thess" };
  const norm = (n: string) => n.toLowerCase().replace(/\s+/g, "");
  const byName = new Map(BOOKS.map((b, i) => [norm(b.name), i]));
  const find = (n: string) => {
    const k = alias[norm(n)];
    if (k) return BOOKS.findIndex((b) => b.osis.toLowerCase() === k);
    const i = byName.get(norm(n));
    if (i === undefined) throw new Error(`M'Cheyne: unknown book ${n}`);
    return i;
  };
  const days = mcheyne.days.map((day: string[]) =>
    day.map((r): Range => {
      const m = /^(.+?) (\d+)(?::(\d+)-(\d+))?(?:-(\d+))?$/.exec(r);
      if (!m) throw new Error(`M'Cheyne: cannot read ${r}`);
      const b = find(m[1]);
      const c1 = Number(m[2]);
      if (m[3]) return [b, c1, c1, Number(m[3]), Number(m[4])];
      return [b, c1, Number(m[5] ?? m[2])];
    }),
  );
  plans.push({
    id: "mcheyne",
    name: "M'Cheyne reading calendar",
    description: "Four readings a day for a year. The New Testament and Psalms are read twice, the rest once. Written in 1842 by Robert Murray M'Cheyne for his congregation and their families.",
    days,
  });
}

// sanity: coverage
for (const p of plans) {
  const total = p.days.flat().reduce((a, [b, c1, c2]) => a + (c2 - c1 + 1), 0);
  for (const d of p.days) if (d.length === 0) throw new Error(`${p.id}: empty day`);
  for (const [b, c1, c2] of p.days.flat()) if (c1 < 1 || c2 > chapterCount(b)) throw new Error(`${p.id}: bad range`);
  console.log(`plan ${p.id}: ${p.days.length} days, ${total} chapters`);
}
fs.rmSync(path.join(OUT, "plans"), { recursive: true, force: true });
for (const p of plans) writeJson(path.join(OUT, "plans", `${p.id}.json`), p);
writeJson(path.join(OUT, "plans", "index.json"), plans.map((p) => ({ id: p.id, name: p.name, description: p.description, days: p.days.length })));
