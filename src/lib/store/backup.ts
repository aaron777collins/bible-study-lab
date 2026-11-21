import { TOTAL_VERSES } from "@/lib/canon/canon";
import { getDb } from "./db";
import { markExported, noteChange } from "./meta";
import { HIGHLIGHT_COLORS } from "./types";
import type { BackupData, BackupFile } from "./types";

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isVerse = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < TOTAL_VERSES;
const isStr = (x: unknown): x is string => typeof x === "string";

export type ValidateResult = { ok: true; file: BackupFile } | { ok: false; error: string };

const MAX_RECORDS = 200_000;

export function exportFileName(now = new Date()): string {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `bible-study-notes-${d}.json`;
}

const KEYS: (keyof BackupData)[] = ["notes", "highlights", "bookmarks", "collections", "plans", "planProgress", "memory"];

/** Check an uploaded backup. Nothing is written until the person confirms, so be strict. */
export function validateBackup(text: string): ValidateResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON. Choose a backup that was exported from Bible Study Lab." };
  }
  if (!isObj(raw)) return { ok: false, error: "This file does not look like a Bible Study Lab backup." };
  if (raw.app !== "bible-study-lab") return { ok: false, error: "This file was not made by Bible Study Lab." };
  if (typeof raw.schema !== "number") return { ok: false, error: "This backup has no version number." };
  if (raw.schema > 1) return { ok: false, error: "This backup was made by a newer version of the app. Reload the page to update, then try again." };
  if (raw.schema !== 1) return { ok: false, error: `This backup version (${raw.schema}) is not supported.` };
  if (!isObj(raw.data)) return { ok: false, error: "This backup has no data section." };
  const data = raw.data;
  let total = 0;
  for (const k of KEYS) {
    const v = data[k];
    if (v === undefined) continue;
    if (!Array.isArray(v)) return { ok: false, error: `The "${k}" section is not a list.` };
    total += v.length;
  }
  if (total > MAX_RECORDS) return { ok: false, error: "This backup is too large to import." };

  const bad = (k: string, i: number, why: string): ValidateResult => ({ ok: false, error: `Problem in ${k}, item ${i + 1}: ${why}.` });
  const out: BackupData = { notes: [], highlights: [], bookmarks: [], collections: [], plans: [], planProgress: [], memory: [] };

  for (const [i, n] of ((data.notes as unknown[]) ?? []).entries()) {
    if (!isObj(n)) return bad("notes", i, "not an object");
    if (!isStr(n.id) || !n.id) return bad("notes", i, "missing id");
    if (!isVerse(n.start) || !isVerse(n.end) || (n.end as number) < (n.start as number)) return bad("notes", i, "the verse range is not valid");
    if (!isStr(n.body)) return bad("notes", i, "the text is missing");
    if (!Array.isArray(n.tags) || !n.tags.every(isStr)) return bad("notes", i, "the tags are not a list of words");
    if (n.kind !== "note" && n.kind !== "prayer" && n.kind !== "study") return bad("notes", i, "unknown kind");
    if (!isNum(n.createdAt) || !isNum(n.updatedAt)) return bad("notes", i, "missing dates");
    if (n.prompts !== undefined && !(isObj(n.prompts) && isStr(n.prompts.observe) && isStr(n.prompts.interpret) && isStr(n.prompts.apply))) return bad("notes", i, "the study prompts are not valid");
    if (n.answeredAt !== undefined && !isNum(n.answeredAt)) return bad("notes", i, "bad answered date");
    out.notes.push(n as unknown as BackupData["notes"][number]);
  }
  for (const [i, h] of ((data.highlights as unknown[]) ?? []).entries()) {
    if (!isObj(h)) return bad("highlights", i, "not an object");
    if (!isVerse(h.verseId)) return bad("highlights", i, "the verse is not valid");
    if (!isStr(h.color) || !(HIGHLIGHT_COLORS as readonly string[]).includes(h.color)) return bad("highlights", i, "unknown color");
    if (!isNum(h.createdAt) || !isNum(h.updatedAt)) return bad("highlights", i, "missing dates");
    out.highlights.push(h as unknown as BackupData["highlights"][number]);
  }
  for (const [i, b] of ((data.bookmarks as unknown[]) ?? []).entries()) {
    if (!isObj(b)) return bad("bookmarks", i, "not an object");
    if (!isStr(b.id) || !b.id) return bad("bookmarks", i, "missing id");
    if (!isVerse(b.start) || !isVerse(b.end)) return bad("bookmarks", i, "the verse range is not valid");
    if (!isStr(b.label)) return bad("bookmarks", i, "missing label");
    if (!isNum(b.createdAt)) return bad("bookmarks", i, "missing date");
    out.bookmarks.push({ updatedAt: b.createdAt as number, ...(b as object) } as unknown as BackupData["bookmarks"][number]);
  }
  for (const [i, c] of ((data.collections as unknown[]) ?? []).entries()) {
    if (!isObj(c)) return bad("collections", i, "not an object");
    if (!isStr(c.id) || !c.id) return bad("collections", i, "missing id");
    if (!isStr(c.title)) return bad("collections", i, "missing title");
    if (!Array.isArray(c.refs) || !c.refs.every((r) => Array.isArray(r) && r.length === 2 && isVerse(r[0]) && isVerse(r[1]))) return bad("collections", i, "the passages are not valid");
    if (!isNum(c.createdAt) || !isNum(c.updatedAt)) return bad("collections", i, "missing dates");
    out.collections.push({ description: "", ...(c as object) } as unknown as BackupData["collections"][number]);
  }
  for (const [i, p] of ((data.plans as unknown[]) ?? []).entries()) {
    if (!isObj(p) || !isStr(p.planId) || !isStr(p.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(p.startDate) || typeof p.active !== "boolean") return bad("plans", i, "not a valid plan");
    out.plans.push({ catchUp: 0, ...(p as object) } as unknown as BackupData["plans"][number]);
  }
  for (const [i, p] of ((data.planProgress as unknown[]) ?? []).entries()) {
    if (!isObj(p) || !isStr(p.planId) || !Number.isInteger(p.day) || !isNum(p.doneAt)) return bad("planProgress", i, "not valid");
    out.planProgress.push(p as unknown as BackupData["planProgress"][number]);
  }
  for (const [i, m] of ((data.memory as unknown[]) ?? []).entries()) {
    if (!isObj(m) || !isStr(m.id) || !isVerse(m.start) || !isVerse(m.end)) return bad("memory", i, "not valid");
    if (!Number.isInteger(m.box) || (m.box as number) < 1 || (m.box as number) > 5 || !isNum(m.dueAt) || !isNum(m.createdAt)) return bad("memory", i, "bad box or dates");
    out.memory.push({ reviews: 0, updatedAt: m.createdAt as number, ...(m as object) } as unknown as BackupData["memory"][number]);
  }
  const counts = Object.fromEntries(KEYS.map((k) => [k, out[k].length])) as BackupFile["counts"];
  return { ok: true, file: { app: "bible-study-lab", schema: 1, exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : "", counts, data: out } };
}

export async function buildBackup(now = new Date()): Promise<BackupFile | null> {
  const db = await getDb();
  if (!db) return null;
  const data: BackupData = {
    notes: await db.getAll("notes"),
    highlights: await db.getAll("highlights"),
    bookmarks: await db.getAll("bookmarks"),
    collections: await db.getAll("collections"),
    plans: await db.getAll("plans"),
    planProgress: await db.getAll("planProgress"),
    memory: await db.getAll("memory"),
  };
  // keep the file about what the person can see: leave out rows deleted more than the undo window ago is done on start
  const counts = Object.fromEntries(KEYS.map((k) => [k, data[k].filter((r) => !(r as { deletedAt?: number }).deletedAt).length])) as BackupFile["counts"];
  return { app: "bible-study-lab", schema: 1, exportedAt: now.toISOString(), counts, data };
}

/** Save the backup as a file download and remember that an export happened. */
export async function downloadBackup(): Promise<boolean> {
  const file = await buildBackup();
  if (!file) return false;
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  await markExported();
  return true;
}

export type ImportMode = "merge" | "replace";

export async function importBackup(file: BackupFile, mode: ImportMode): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const stores = ["notes", "highlights", "bookmarks", "collections", "plans", "planProgress", "memory"] as const;
  const tx = db.transaction([...stores], "readwrite");
  if (mode === "replace") for (const s of stores) await tx.objectStore(s).clear();
  const newer = (a?: { updatedAt?: number }, b?: { updatedAt?: number }) => (a?.updatedAt ?? 0) > (b?.updatedAt ?? 0);
  for (const n of file.data.notes) {
    const cur = await tx.objectStore("notes").get(n.id);
    if (!cur || newer(n, cur)) await tx.objectStore("notes").put(n);
  }
  for (const h of file.data.highlights) {
    const cur = await tx.objectStore("highlights").get(h.verseId);
    if (!cur || newer(h, cur)) await tx.objectStore("highlights").put(h);
  }
  for (const b of file.data.bookmarks) {
    const cur = await tx.objectStore("bookmarks").get(b.id);
    if (!cur || newer(b, cur)) await tx.objectStore("bookmarks").put(b);
  }
  for (const c of file.data.collections) {
    const cur = await tx.objectStore("collections").get(c.id);
    if (!cur || newer(c, cur)) await tx.objectStore("collections").put(c);
  }
  for (const p of file.data.plans) {
    const cur = await tx.objectStore("plans").get(p.planId);
    if (!cur || mode === "replace") await tx.objectStore("plans").put(p);
  }
  for (const p of file.data.planProgress) await tx.objectStore("planProgress").put(p);
  for (const m of file.data.memory) {
    const cur = await tx.objectStore("memory").get(m.id);
    if (!cur || newer(m, cur)) await tx.objectStore("memory").put(m);
  }
  await tx.done;
  // an imported file is a backup that already exists, so it does not count as unsaved work
  const total = Object.values(file.counts).reduce((a, b) => a + b, 0);
  if (total) await noteChange(0);
  await markExported();
  return true;
}
