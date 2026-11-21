import { getDb, newId, useStoreStatus } from "./db";
import { noteChange } from "./meta";
import { guardWrite } from "./warn";
import { DAY, SOFT_DELETE_DAYS } from "./types";
import type { Bookmark, Collection, Highlight, HighlightColor, MemoryItem, Note, NoteKind, PlanProgress, PlanState, Prompts } from "./types";

const live = <T extends { deletedAt?: number }>(rows: T[]) => rows.filter((r) => !r.deletedAt);

// ---- notes ----
export interface NoteInput {
  start: number;
  end?: number;
  body: string;
  tags?: string[];
  kind?: NoteKind;
  prompts?: Prompts;
}

export function cleanTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const c = t.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
    if (c && !out.includes(c)) out.push(c.slice(0, 40));
  }
  return out;
}

export async function saveNote(input: NoteInput & { id?: string }): Promise<Note | null> {
  await guardWrite();
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const prev = input.id ? await db.get("notes", input.id) : undefined;
  const note: Note = {
    id: input.id ?? newId(),
    start: input.start,
    end: Math.max(input.end ?? input.start, input.start),
    body: input.body,
    tags: cleanTags(input.tags ?? prev?.tags ?? []),
    kind: input.kind ?? prev?.kind ?? "note",
    prompts: input.prompts ?? prev?.prompts,
    answeredAt: prev?.answeredAt,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  await db.put("notes", note);
  await noteChange();
  return note;
}

export async function setPrayerAnswered(id: string, answered: boolean) {
  await guardWrite();
  const db = await getDb();
  const n = db && (await db.get("notes", id));
  if (!db || !n) return;
  const next = { ...n, updatedAt: Date.now() };
  if (answered) next.answeredAt = Date.now();
  else delete next.answeredAt;
  await db.put("notes", next);
  await noteChange();
}

export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  if (!db) return [];
  return live(await db.getAll("notes")).sort((a, b) => b.updatedAt - a.updatedAt);
}
/** Notes whose range touches the verse range [start, end]. */
export async function notesForRange(start: number, end = start): Promise<Note[]> {
  return (await listNotes()).filter((n) => n.start <= end && n.end >= start).sort((a, b) => a.start - b.start || b.updatedAt - a.updatedAt);
}

// generic soft delete / restore
type DeletableStore = "notes" | "highlights" | "bookmarks" | "collections" | "memory";
export async function softDelete(store: DeletableStore, key: string | number) {
  await guardWrite();
  const db = await getDb();
  if (!db) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = (await db.get(store as any, key as any)) as { deletedAt?: number; updatedAt?: number } | undefined;
  if (!row) return;
  row.deletedAt = Date.now();
  row.updatedAt = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.put(store as any, row as any);
  await noteChange();
}
export async function restore(store: DeletableStore, key: string | number) {
  await guardWrite();
  const db = await getDb();
  if (!db) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = (await db.get(store as any, key as any)) as { deletedAt?: number; updatedAt?: number } | undefined;
  if (!row) return;
  delete row.deletedAt;
  row.updatedAt = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.put(store as any, row as any);
  await noteChange();
}

/** Remove soft deleted rows older than 30 days. Run on start. */
export async function purgeDeleted(now = Date.now()): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  let removed = 0;
  const cutoff = now - SOFT_DELETE_DAYS * DAY;
  for (const store of ["notes", "highlights", "bookmarks", "collections", "memory"] as const) {
    const tx = db.transaction(store, "readwrite");
    let cursor = await tx.store.openCursor();
    while (cursor) {
      const v = cursor.value as { deletedAt?: number };
      if (v.deletedAt && v.deletedAt < cutoff) {
        await cursor.delete();
        removed++;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
  }
  return removed;
}

// ---- highlights ----
export async function setHighlight(verseId: number, color: HighlightColor | null) {
  await guardWrite();
  const db = await getDb();
  if (!db) return;
  if (color === null) {
    const h = await db.get("highlights", verseId);
    if (h) await db.delete("highlights", verseId);
  } else {
    const prev = await db.get("highlights", verseId);
    const now = Date.now();
    await db.put("highlights", { verseId, color, createdAt: prev?.createdAt ?? now, updatedAt: now });
  }
  await noteChange();
}
export async function highlightsInRange(start: number, end: number): Promise<Map<number, HighlightColor>> {
  const db = await getDb();
  const m = new Map<number, HighlightColor>();
  if (!db) return m;
  for (const h of live(await db.getAll("highlights", IDBKeyRange.bound(start, end)))) m.set(h.verseId, h.color);
  return m;
}
export async function listHighlights(): Promise<Highlight[]> {
  const db = await getDb();
  return db ? live(await db.getAll("highlights")).sort((a, b) => a.verseId - b.verseId) : [];
}

// ---- bookmarks ----
export async function addBookmark(start: number, end: number, label: string): Promise<Bookmark | null> {
  await guardWrite();
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const b: Bookmark = { id: newId(), start, end: Math.max(start, end), label, createdAt: now, updatedAt: now };
  await db.put("bookmarks", b);
  await noteChange();
  return b;
}
export async function listBookmarks(): Promise<Bookmark[]> {
  const db = await getDb();
  return db ? live(await db.getAll("bookmarks")).sort((a, b) => a.start - b.start) : [];
}
export async function bookmarkAt(id: number): Promise<Bookmark | undefined> {
  return (await listBookmarks()).find((b) => b.start <= id && b.end >= id);
}

// ---- collections ----
export async function saveCollection(c: { id?: string; title: string; refs: [number, number][]; description?: string }): Promise<Collection | null> {
  await guardWrite();
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const prev = c.id ? await db.get("collections", c.id) : undefined;
  const col: Collection = { id: c.id ?? newId(), title: c.title.trim() || "Untitled", refs: c.refs, description: c.description ?? prev?.description ?? "", createdAt: prev?.createdAt ?? now, updatedAt: now };
  await db.put("collections", col);
  await noteChange();
  return col;
}
export async function listCollections(): Promise<Collection[]> {
  const db = await getDb();
  return db ? live(await db.getAll("collections")).sort((a, b) => b.updatedAt - a.updatedAt) : [];
}

// ---- reading plans ----
export const todayIso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function startPlan(planId: string, startDate = todayIso()) {
  await guardWrite();
  const db = await getDb();
  if (!db) return;
  await db.put("plans", { planId, startDate, active: true, catchUp: 0 });
  await noteChange();
}
export async function stopPlan(planId: string) {
  await guardWrite();
  const db = await getDb();
  const p = db && (await db.get("plans", planId));
  if (!db || !p) return;
  await db.put("plans", { ...p, active: false });
  await noteChange();
}
export async function listPlans(): Promise<PlanState[]> {
  const db = await getDb();
  return db ? db.getAll("plans") : [];
}
export async function listProgress(planId: string): Promise<PlanProgress[]> {
  const db = await getDb();
  return db ? db.getAllFromIndex("planProgress", "by-plan", planId) : [];
}
export async function setDayDone(planId: string, day: number, done: boolean) {
  await guardWrite();
  const db = await getDb();
  if (!db) return;
  if (done) await db.put("planProgress", { planId, day, doneAt: Date.now() });
  else await db.delete("planProgress", [planId, day]);
  await noteChange();
}
/** "Catch up": move the start date forward so today is the first day not yet done. */
export async function catchUpPlan(planId: string, newStart = todayIso()) {
  await guardWrite();
  const db = await getDb();
  const p = db && (await db.get("plans", planId));
  if (!db || !p) return;
  const days = Math.round((Date.parse(newStart) - Date.parse(p.startDate)) / DAY);
  await db.put("plans", { ...p, startDate: newStart, catchUp: p.catchUp + Math.max(0, days) });
  await noteChange();
}

// ---- memory verses ----
export async function addMemory(start: number, end: number): Promise<MemoryItem | null> {
  await guardWrite();
  const db = await getDb();
  if (!db) return null;
  const existing = live(await db.getAll("memory")).find((m) => m.start === start && m.end === end);
  if (existing) return existing;
  const now = Date.now();
  const m: MemoryItem = { id: newId(), start, end, box: 1, dueAt: now, reviews: 0, createdAt: now, updatedAt: now };
  await db.put("memory", m);
  await noteChange();
  return m;
}
export async function listMemory(): Promise<MemoryItem[]> {
  const db = await getDb();
  return db ? live(await db.getAll("memory")).sort((a, b) => a.dueAt - b.dueAt) : [];
}
export async function saveMemory(m: MemoryItem) {
  await guardWrite();
  const db = await getDb();
  if (!db) return;
  await db.put("memory", { ...m, updatedAt: Date.now() });
  await noteChange();
}

export function bumpStore() {
  useStoreStatus.getState().bump();
}
