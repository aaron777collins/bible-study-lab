import fs from "node:fs";
import path from "node:path";
import { BOOKS } from "../src/lib/canon/books.ts";
import { parseUsfm, type ParsedBook } from "./usfm.ts";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const RAW = path.join(ROOT, "data-raw");
export const OUT = path.join(ROOT, "public", "data", "v1");
export const REPORT_DIR = path.join(ROOT, "scripts", "out");

export const TRANSLATIONS = [
  { id: "kjv", name: "King James Version", short: "KJV", dir: "eng-kjv2006_usfm" },
  { id: "web", name: "World English Bible", short: "WEB", dir: "engwebp_usfm" },
  { id: "asv", name: "American Standard Version", short: "ASV", dir: "eng-asv_usfm" },
  { id: "ylt", name: "Young's Literal Translation", short: "YLT", dir: "engylt_usfm" },
] as const;

export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data) + "\n");
}

export function readUsfmBook(dir: string, usfm: string): ParsedBook {
  const full = path.join(RAW, dir);
  const f = fs.readdirSync(full).find((n) => n.endsWith(".usfm") && n.slice(2).startsWith("-" + usfm));
  if (!f) throw new Error(`missing USFM for ${usfm} in ${dir}`);
  return parseUsfm(fs.readFileSync(path.join(full, f), "utf8"));
}

export function allBooks() {
  return BOOKS.map((b, i) => ({ ...b, index: i }));
}

export function report(name: string, lines: string[]) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, name), lines.join("\n") + "\n");
}
