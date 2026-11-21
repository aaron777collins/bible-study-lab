/** Runs every build step in order. Needs data-raw/ (run `npm run data:fetch` first). */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { OUT, writeJson } from "./lib.ts";

for (const step of ["build-canon", "build-text", "build-xref", "build-strongs", "build-topics", "build-insights", "build-votd", "build-plans"]) {
  console.log(`\n> ${step}`);
  execFileSync(process.execPath, ["--import", "tsx", path.join(import.meta.dirname, `${step}.ts`)], { stdio: "inherit" });
}
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(OUT, p), "utf8"));
writeJson(path.join(OUT, "manifest.json"), {
  schema: 1,
  translations: read("translations.json"),
  xref: read("xref/stats.json"),
  strongs: read("strongs/stats.json"),
  topics: read("topics/stats.json"),
});
