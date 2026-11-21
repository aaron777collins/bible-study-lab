/**
 * 366 verse of the day references, chosen from the highest scored single verses in OpenBible topics
 * that are about encouragement and growth. Round robin across topics so the year has variety.
 */
import fs from "node:fs";
import path from "node:path";
import { OUT, writeJson } from "./lib.ts";
import { bookOfId, idFromOsis } from "../src/lib/canon/canon.ts";

const TOPICS = "hope love faith peace strength comfort joy grace forgiveness prayer trust wisdom courage salvation encouragement patience guidance protection healing mercy kindness obedience thankfulness gratitude faithfulness perseverance humility purpose rest light compassion contentment generosity fear anxiety worry loneliness eternal-life resurrection repentance truth righteousness serving gods-love gods-provision unity blessing freedom victory praise goodness power creation heaven gentleness self-control friendship family children work leadership honesty new-life jesus holy-spirit blessings assurance trusting-god boldness diligence discipline joyfulness kingdom-of-god comforting promises provision answered-prayer redemption refuge shepherd grace-of-god endurance rejoicing love-of-god fruit-of-the-spirit waiting-on-god gods-help gods-strength adoption children-of-god new-creation security spiritual-growth fellowship encouragement love-your-neighbor loving-others overcoming victory-in-christ".split(" ");
/**
 * Reviewed by hand: verses that score well in a topic but read badly on their own as a verse for the day
 * (harsh, narrow, or not complete without the sentences around them).
 */
const EXCLUDE = new Set(
  "1Tim.3.5 Exod.18.21 Gen.6.6 1Cor.15.33 Eph.4.28 1Cor.9.27 Jer.23.1 Heb.13.17 Titus.1.8 Lev.20.13 Matt.25.46 Prov.16.4 Job.6.14 Gen.2.15 Prov.28.1 1Cor.7.17 1Cor.4.20 2Thess.3.10 1Tim.5.8 Acts.24.3 Luke.10.19 Isa.26.19 Matt.6.27 Luke.6.46 Rev.3.19 Isa.1.19 Luke.13.3 Jas.2.13 Prov.12.1 Prov.13.4 Prov.10.4 Exod.23.22 Josh.22.5 Gal.5.23 2Cor.8.21 John.18.36 Prov.28.20 Matt.3.2 Matt.4.17 Gen.2.24 Gen.1.26 Rom.1.20 Eph.1.16 Dan.2.44 1John.2.29 Matt.5.20 Matt.6.15 Prov.11.2 Prov.12.22 1Sam.12.24 Ps.119.76 Phil.2.4 Acts.28.31 1Cor.2.5 1Cor.1.10 Mark.6.31 Prov.13.24 Titus.2.6 Acts.17.30 1Pet.5.5 1Pet.5.3 Matt.3.8 Jas.2.19 Prov.12.24 Prov.18.12 Prov.14.23 Prov.19.1 1Pet.5.8 Eph.6.19 Eph.6.7 1Cor.6.12 Acts.11.18 1Cor.4.2 Mark.9.35 Matt.20.26 Matt.7.21 Matt.6.24 Matt.16.19 Col.1.16 Rom.10.4 2Cor.13.11 Phil.4.5 Heb.6.11 Phil.1.20 Prov.16.32 Prov.28.13 Prov.27.17 Luke.11.28 2Pet.3.14 Eph.5.8 Eph.3.12 Rom.14.17 Heb.12.14 Jas.3.18 1John.5.3 Prov.22.29 Acts.7.21 Prov.27.9 Lev.19.18 Matt.18.5 Prov.22.15 Rom.8.6 2Cor.7.1 1John.3.9 1John.5.18 2Cor.6.14 Eccl.12.7 Jas.1.27 Luke.10.20 Ps.108.13 Matt.22.32 Job.11.18 Isa.64.4 Eph.5.9 Prov.10.12 Prov.3.6 1Cor.1.30 Eph.1.5 Eph.1.13 Prov.29.11 Gal.6.15 Esth.2.7 Num.30.2 Prov.23.13 Prov.29.15 Prov.18.9 Heb.6.13 Prov.31.8 Prov.29.17 Rev.20.15".split(" ").map((o) => idFromOsis(o)),
);
EXCLUDE.delete(-1);
const dir = path.join(OUT, "topics");
const cache = new Map<string, Record<string, number[]>>();
const load = (letter: string) => {
  if (!cache.has(letter)) cache.set(letter, JSON.parse(fs.readFileSync(path.join(dir, `${letter}.json`), "utf8")));
  return cache.get(letter)!;
};
const lists = TOPICS.filter((s) => (load(s[0])[s] ?? []).length > 0).map((slug) => {
  const flat = load(slug[0])[slug] ?? [];
  const singles: [number, number][] = [];
  for (let i = 0; i < flat.length; i += 3) if (flat[i + 1] === 0) singles.push([flat[i], flat[i + 2]]);
  return singles.sort((a, b) => b[1] - a[1] || a[0] - b[0]).map((x) => x[0]);
});
const chosen: number[] = [];
const seen = new Set<number>();
const bookCount = new Map<number, number>();
for (let round = 0; chosen.length < 366 && round < 40; round++) {
  for (const l of lists) {
    // next unseen verse in this topic, avoiding more than 18 from one book
    while (l.length) {
      const id = l.shift()!;
      if (EXCLUDE.has(id) || seen.has(id) || (bookCount.get(bookOfId(id)) ?? 0) >= 24) continue;
      seen.add(id);
      bookCount.set(bookOfId(id), (bookCount.get(bookOfId(id)) ?? 0) + 1);
      chosen.push(id);
      break;
    }
    if (chosen.length >= 366) break;
  }
}
if (chosen.length < 366) throw new Error(`only ${chosen.length} verses for the verse of the day`);
// deterministic shuffle so topics are not in blocks
let seed = 20261120;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
for (let i = chosen.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
}
writeJson(path.join(OUT, "votd.json"), chosen);
console.log("votd:", chosen.length, "verses from", bookCount.size, "books");
