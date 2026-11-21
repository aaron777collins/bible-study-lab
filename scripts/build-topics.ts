/** OpenBible topical Bible scores (CC BY 4.0) to a topic index and per-letter passage files. */
import fs from "node:fs";
import path from "node:path";
import { OUT, RAW, report, writeJson } from "./lib.ts";
import { idFromOsis } from "../src/lib/canon/canon.ts";

const src = fs.readFileSync(path.join(RAW, "topic-scores", "topic-scores.txt"), "utf8").split("\n");
const topics = new Map<string, { name: string; passages: [number, number, number][] }>();
const exceptions: string[] = [];
const slugOf = (name: string) => name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
let rows = 0;
for (const line of src) {
  if (!line || line.startsWith("Topic\t") || line.startsWith("#")) continue;
  const [name, osis, score] = line.split("\t");
  rows++;
  const [a, b] = osis.split("-");
  const start = idFromOsis(a, true);
  let end = b ? idFromOsis(b, true) : 0;
  const s = Number(score);
  if (start < 0 || (b && end < 0) || !Number.isFinite(s)) {
    exceptions.push(line);
    continue;
  }
  if (end <= start) end = 0;
  const slug = slugOf(name);
  if (!slug) {
    exceptions.push(line);
    continue;
  }
  let t = topics.get(slug);
  if (!t) topics.set(slug, (t = { name: name.trim(), passages: [] }));
  t.passages.push([start, end, s]);
}
fs.rmSync(path.join(OUT, "topics"), { recursive: true, force: true });
const index: [string, string, number][] = [];
const letters = new Map<string, Record<string, number[]>>();
for (const [slug, t] of [...topics].sort((a, b) => a[0].localeCompare(b[0]))) {
  t.passages.sort((x, y) => y[2] - x[2] || x[0] - y[0]);
  index.push([t.name, slug, t.passages.length]);
  const l = /^[a-z]/.test(slug) ? slug[0] : "0";
  let o = letters.get(l);
  if (!o) letters.set(l, (o = {}));
  o[slug] = t.passages.flat();
}
writeJson(path.join(OUT, "topics", "index.json"), index);
for (const [l, o] of letters) writeJson(path.join(OUT, "topics", `${l}.json`), o);
report("topics-exceptions.txt", ["Topic rows that do not resolve to a KJV verse:", ...exceptions]);
writeJson(path.join(OUT, "topics", "stats.json"), { rows, topics: topics.size, exceptions: exceptions.length });
console.log(`topics: ${rows} rows, ${topics.size} topics, ${exceptions.length} exceptions`);
