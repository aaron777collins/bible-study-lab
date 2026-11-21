/**
 * 366 verse of the day references, chosen from the highest scored single verses in OpenBible topics
 * that are about encouragement and growth. Round robin across topics so the year has variety.
 */
import fs from "node:fs";
import path from "node:path";
import { OUT, writeJson } from "./lib.ts";
import { bookOfId } from "../src/lib/canon/canon.ts";

const TOPICS = "hope love faith peace strength comfort joy grace forgiveness prayer trust wisdom courage salvation encouragement patience guidance protection healing mercy kindness obedience thankfulness gratitude faithfulness perseverance humility purpose rest light compassion contentment generosity fear anxiety worry loneliness eternal-life resurrection repentance truth righteousness serving gods-love gods-provision unity blessing freedom victory praise goodness power creation heaven gentleness self-control friendship family children work leadership honesty new-life jesus holy-spirit blessings assurance trusting-god boldness diligence discipline joyfulness kingdom-of-god".split(" ");
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
      if (seen.has(id) || (bookCount.get(bookOfId(id)) ?? 0) >= 24) continue;
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
