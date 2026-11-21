/** Lists the data files in groups, with sizes, so the app can offer "Download for offline" and show what it costs. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { OUT, TRANSLATIONS, writeJson } from "./lib.ts";

const walk = (dir: string, base = dir): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]));

const sizeOf = (files: string[]) => {
  let gz = 0;
  for (const f of files) gz += zlib.gzipSync(fs.readFileSync(path.join(OUT, f))).length;
  return gz;
};
const all = walk(OUT).filter((f) => f !== "files.json" && f !== "manifest.json" && !f.endsWith(".txt"));
const group = (id: string, label: string, test: (f: string) => boolean) => {
  const files = all.filter(test).sort();
  return { id, label, files, gzipBytes: sizeOf(files) };
};
const groups = [
  ...TRANSLATIONS.map((t) => group(`text-${t.id}`, `${t.name} (${t.short})`, (f) => f.startsWith(`text/${t.id}/`))),
  group("xref", "Cross references", (f) => f.startsWith("xref/")),
  group("strongs", "Word study (Strong's numbers)", (f) => f.startsWith("strongs/")),
  group("topics", "Topics", (f) => f.startsWith("topics/")),
  group("insights", "Insights and word counts", (f) => f.startsWith("insights/")),
];
writeJson(path.join(OUT, "files.json"), { groups });
console.log(groups.map((g) => `${g.id}: ${g.files.length} files, ${(g.gzipBytes / 1e6).toFixed(2)} MB gzip`).join("\n"));
