/**
 * Downloads every data source into data-raw/ and checks it against scripts/sources.lock.json.
 *   npm run data:fetch            verify (fail if a hash changed)
 *   npm run data:fetch -- --update  accept changed files and rewrite the lock
 * License guard: each eBible package must still say "Public Domain" in copr.htm.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { RAW, ROOT } from "./lib.ts";

const STRONGS_SHA = "0acd2f251c2d35ff8db2dece4e0593979d3ac223";

interface Source {
  id: string;
  url: string;
  file: string;
  license: string;
  licenseUrl: string;
  unzipTo?: string;
  mustContain?: { file: string; text: string };
}

const SOURCES: Source[] = [
  ...[
    ["kjv", "eng-kjv2006_usfm"],
    ["web", "engwebp_usfm"],
    ["asv", "eng-asv_usfm"],
    ["ylt", "engylt_usfm"],
  ].map(([id, dir]) => ({
    id: `ebible-${id}`,
    url: `https://ebible.org/Scriptures/${dir}.zip`,
    file: `${dir}.zip`,
    license: "Public Domain (per eBible copr.htm)",
    licenseUrl: "https://ebible.org/find/",
    unzipTo: dir,
    mustContain: { file: "copr.htm", text: "Public Domain" },
  })),
  {
    id: "openbible-cross-references",
    url: "https://a.openbible.info/data/cross-references.zip",
    file: "cross-references.zip",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    unzipTo: "cross-references",
    mustContain: { file: "cross_references.txt", text: "CC-BY" },
  },
  {
    id: "openbible-topic-scores",
    url: "https://a.openbible.info/data/topic-scores.zip",
    file: "topic-scores.zip",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    unzipTo: "topic-scores",
    mustContain: { file: "topic-scores.txt", text: "CC-BY" },
  },
  {
    id: "openscriptures-strongs-greek",
    url: `https://github.com/openscriptures/strongs/raw/${STRONGS_SHA}/greek/strongs-greek-dictionary.js`,
    file: "strongs-greek-dictionary.js",
    license: "CC BY-SA (Open Scriptures JSON edition of the public domain Strong's 1890)",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    mustContain: { file: "strongs-greek-dictionary.js", text: "CC-BY-SA" },
  },
  {
    id: "openscriptures-strongs-hebrew",
    url: `https://github.com/openscriptures/strongs/raw/${STRONGS_SHA}/hebrew/strongs-hebrew-dictionary.js`,
    file: "strongs-hebrew-dictionary.js",
    license: "CC BY-SA (Open Scriptures JSON edition of the public domain Strong's 1894)",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    mustContain: { file: "strongs-hebrew-dictionary.js", text: "CC-BY-SA" },
  },
];

const LOCK = path.join(ROOT, "scripts", "sources.lock.json");
const update = process.argv.includes("--update");
const lock: Record<string, { url: string; license: string; licenseUrl: string; retrieved: string; sha256: string; bytes: number }> = fs.existsSync(LOCK)
  ? JSON.parse(fs.readFileSync(LOCK, "utf8"))
  : {};

const sha = (buf: Buffer) => crypto.createHash("sha256").update(buf).digest("hex");

async function main() {
  fs.mkdirSync(RAW, { recursive: true });
  let failed = false;
  for (const s of SOURCES) {
    const dest = path.join(RAW, s.file);
    let buf: Buffer;
    if (fs.existsSync(dest) && lock[s.id] && sha(fs.readFileSync(dest)) === lock[s.id].sha256) {
      buf = fs.readFileSync(dest);
    } else {
      const res = await fetch(s.url, { redirect: "follow" });
      if (!res.ok) throw new Error(`${s.id}: HTTP ${res.status} for ${s.url}`);
      buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
    }
    const hash = sha(buf);
    const prev = lock[s.id];
    if (prev && prev.sha256 !== hash && !update) {
      console.error(`${s.id}: hash changed (${prev.sha256.slice(0, 12)} -> ${hash.slice(0, 12)}). Run with --update to accept.`);
      failed = true;
      continue;
    }
    if (s.unzipTo) {
      const dir = path.join(RAW, s.unzipTo);
      if (!fs.existsSync(dir) || prev?.sha256 !== hash) {
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });
        execFileSync("unzip", ["-q", "-o", dest, "-d", dir]);
      }
    }
    if (s.mustContain) {
      const f = path.join(RAW, s.unzipTo ?? "", s.mustContain.file);
      const txt = fs.readFileSync(f, "utf8");
      if (!txt.includes(s.mustContain.text)) {
        console.error(`${s.id}: license text "${s.mustContain.text}" not found in ${s.mustContain.file}. Check the license before continuing.`);
        failed = true;
        continue;
      }
    }
    if (!prev || prev.sha256 !== hash) {
      lock[s.id] = { url: s.url, license: s.license, licenseUrl: s.licenseUrl, retrieved: prev && prev.sha256 === hash ? prev.retrieved : new Date().toISOString().slice(0, 10), sha256: hash, bytes: buf.length };
    }
    console.log(`${s.id}: ok (${buf.length} bytes)`);
  }
  if (failed) process.exit(1);
  fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
}
main();
