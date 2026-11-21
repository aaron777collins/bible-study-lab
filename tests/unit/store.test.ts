import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteDB } from "idb";
import { getDb, resetDb, useStoreStatus, DB_NAME } from "@/lib/store/db";
import { markExported, noteChange, readMeta, shouldRemindExport } from "@/lib/store/meta";
import { addBookmark, addMemory, catchUpPlan, cleanTags, highlightsInRange, listBookmarks, listCollections, listHighlights, listMemory, listNotes, listPlans, listProgress, notesForRange, purgeDeleted, restore, saveCollection, saveMemory, saveNote, setDayDone, setHighlight, setPrayerAnswered, softDelete, startPlan } from "@/lib/store/repo";
import { buildBackup, exportFileName, importBackup, validateBackup } from "@/lib/store/backup";
import { review, cue, BOX_INTERVAL_DAYS } from "@/lib/store/memorize";
import { DAY } from "@/lib/store/types";

beforeEach(async () => {
  const db = await getDb();
  db?.close();
  resetDb();
  await deleteDB(DB_NAME);
  resetDb();
});

describe("notes", () => {
  it("creates, updates and finds notes by verse range", async () => {
    const n = await saveNote({ start: 100, end: 102, body: "first", tags: ["#Grace", "grace", " Big Idea "] });
    expect(n?.tags).toEqual(["grace", "big-idea"]);
    expect((await listNotes()).map((x) => x.body)).toEqual(["first"]);
    const u = await saveNote({ id: n!.id, start: 100, end: 102, body: "second" });
    expect(u?.createdAt).toBe(n?.createdAt);
    expect(u?.tags).toEqual(["grace", "big-idea"]);
    expect((await notesForRange(101)).length).toBe(1);
    expect((await notesForRange(103)).length).toBe(0);
    expect((await notesForRange(90, 100)).length).toBe(1);
  });

  it("tracks kinds, prompts and answered prayers", async () => {
    const p = await saveNote({ start: 5, body: "pray", kind: "prayer" });
    await setPrayerAnswered(p!.id, true);
    expect((await listNotes())[0].answeredAt).toBeTypeOf("number");
    await setPrayerAnswered(p!.id, false);
    expect((await listNotes())[0].answeredAt).toBeUndefined();
    const s = await saveNote({ start: 5, body: "", kind: "study", prompts: { observe: "o", interpret: "i", apply: "a" } });
    expect((await listNotes()).find((n) => n.id === s!.id)?.prompts?.apply).toBe("a");
  });

  it("soft deletes, restores and purges after 30 days", async () => {
    const n = await saveNote({ start: 1, body: "x" });
    await softDelete("notes", n!.id);
    expect(await listNotes()).toHaveLength(0);
    await restore("notes", n!.id);
    expect(await listNotes()).toHaveLength(1);
    await softDelete("notes", n!.id);
    expect(await purgeDeleted(Date.now() + 10 * DAY)).toBe(0);
    expect(await purgeDeleted(Date.now() + 31 * DAY)).toBe(1);
    const db = await getDb();
    expect(await db!.get("notes", n!.id)).toBeUndefined();
  });

  it("cleans tags", () => {
    expect(cleanTags(["#A", "a", "", "  b c  "])).toEqual(["a", "b-c"]);
  });
});

describe("highlights and bookmarks", () => {
  it("sets, changes and clears a highlight", async () => {
    await setHighlight(10, "gold");
    await setHighlight(11, "sky");
    expect((await highlightsInRange(10, 11)).get(10)).toBe("gold");
    await setHighlight(10, "rose");
    expect((await listHighlights()).find((h) => h.verseId === 10)?.color).toBe("rose");
    await setHighlight(10, null);
    expect(await listHighlights()).toHaveLength(1);
  });
  it("adds and removes bookmarks", async () => {
    const b = await addBookmark(7, 9, "Genesis 1:7-9");
    expect((await listBookmarks())[0].label).toBe("Genesis 1:7-9");
    await softDelete("bookmarks", b!.id);
    expect(await listBookmarks()).toHaveLength(0);
  });
});

describe("collections, plans and memory", () => {
  it("keeps collections", async () => {
    const c = await saveCollection({ title: "Week 3: grace", refs: [[1, 2]] });
    await saveCollection({ id: c!.id, title: "Week 3: grace", refs: [[1, 2], [5, 5]] });
    const all = await listCollections();
    expect(all).toHaveLength(1);
    expect(all[0].refs).toHaveLength(2);
  });
  it("records plan progress and catches up", async () => {
    await startPlan("john-21", "2026-01-01");
    await setDayDone("john-21", 1, true);
    await setDayDone("john-21", 2, true);
    await setDayDone("john-21", 2, false);
    expect((await listProgress("john-21")).map((p) => p.day)).toEqual([1]);
    await catchUpPlan("john-21", "2026-01-11");
    const p = (await listPlans())[0];
    expect(p.startDate).toBe("2026-01-11");
    expect(p.catchUp).toBe(10);
  });
  it("adds memory verses once", async () => {
    const a = await addMemory(100, 100);
    const b = await addMemory(100, 100);
    expect(b?.id).toBe(a?.id);
    expect(await listMemory()).toHaveLength(1);
    await saveMemory({ ...a!, box: 3 });
    expect((await listMemory())[0].box).toBe(3);
  });
});

describe("memory review", () => {
  const base = { id: "m", start: 1, end: 1, box: 2, dueAt: 0, reviews: 0, createdAt: 0, updatedAt: 0 };
  it("moves up a box when right and back to box 1 when wrong", () => {
    const now = 1_000_000;
    const up = review(base, true, now);
    expect(up.box).toBe(3);
    expect(up.dueAt).toBe(now + BOX_INTERVAL_DAYS[3] * DAY);
    expect(review({ ...base, box: 5 }, true, now).box).toBe(5);
    const down = review({ ...base, box: 4 }, false, now);
    expect(down.box).toBe(1);
    expect(down.dueAt).toBe(now + BOX_INTERVAL_DAYS[1] * DAY);
    expect(down.reviews).toBe(1);
  });
  it("shows less of the verse as the box rises", () => {
    const t = "For God so loved the world";
    expect(cue(t, 1)).toBe("F__ G__ s_ l____ t__ w____");
    expect(cue(t, 2)).toBe("F G s l t w");
    expect(cue(t, 3).split(" ")[1]).toBe("_");
    expect(cue(t, 5)).toBe("For ...");
  });
});

describe("export reminders", () => {
  it("counts changes, remembers the first write and resets on export", async () => {
    expect((await readMeta()).firstWriteAt).toBeUndefined();
    await saveNote({ start: 1, body: "a" });
    const m = await readMeta();
    expect(m.firstWriteAt).toBeTypeOf("number");
    expect(m.changesSinceExport).toBe(1);
    await markExported();
    const after = await readMeta();
    expect(after.changesSinceExport).toBe(0);
    expect(after.lastExportAt).toBeTypeOf("number");
  });
  it("reminds until the first export, then after 30 days or 25 changes", () => {
    const now = Date.now();
    expect(shouldRemindExport({ changesSinceExport: 0 }, now)).toBe(false);
    expect(shouldRemindExport({ changesSinceExport: 1, firstWriteAt: now }, now)).toBe(true);
    expect(shouldRemindExport({ changesSinceExport: 3, firstWriteAt: now - 5 * DAY, lastExportAt: now - DAY }, now)).toBe(false);
    expect(shouldRemindExport({ changesSinceExport: 25, firstWriteAt: now - 5 * DAY, lastExportAt: now - DAY }, now)).toBe(true);
    expect(shouldRemindExport({ changesSinceExport: 24, firstWriteAt: now - 5 * DAY, lastExportAt: now - DAY }, now)).toBe(false);
    expect(shouldRemindExport({ changesSinceExport: 2, firstWriteAt: now - 60 * DAY, lastExportAt: now - 30 * DAY }, now)).toBe(true);
    expect(shouldRemindExport({ changesSinceExport: 2, firstWriteAt: now - 60 * DAY, lastExportAt: now - 29 * DAY }, now)).toBe(false);
  });
  it("calls noteChange without a database safely", async () => {
    await noteChange(0);
    expect(useStoreStatus.getState().state).toBe("ready");
  });
});

describe("export and import", () => {
  it("names the file by date", () => {
    expect(exportFileName(new Date(2026, 10, 20))).toBe("bible-study-notes-2026-11-20.json");
  });

  it("exports then imports into a fresh browser with identical data", async () => {
    await saveNote({ start: 100, end: 101, body: "note one", tags: ["a"], kind: "prayer" });
    await setHighlight(100, "gold");
    await addBookmark(100, 100, "Gen");
    await saveCollection({ title: "C", refs: [[1, 1]] });
    await startPlan("john-21", "2026-02-01");
    await setDayDone("john-21", 3, true);
    await addMemory(50, 50);
    const file = await buildBackup(new Date("2026-11-20T12:00:00Z"));
    expect(file?.counts).toMatchObject({ notes: 1, highlights: 1, bookmarks: 1, collections: 1, plans: 1, planProgress: 1, memory: 1 });
    const text = JSON.stringify(file);
    const v = validateBackup(text);
    expect(v.ok).toBe(true);

    // a fresh browser
    (await getDb())?.close();
    resetDb();
    await deleteDB(DB_NAME);
    resetDb();
    expect(await listNotes()).toHaveLength(0);
    if (!v.ok) throw new Error("unreachable");
    expect(await importBackup(v.file, "merge")).toBe(true);
    const again = await buildBackup(new Date("2026-11-20T12:00:00Z"));
    expect(again?.data).toEqual(file?.data);
    // an imported file counts as already exported
    expect((await readMeta()).changesSinceExport).toBe(0);
  });

  it("merge keeps the newer version of a note, replace uses the file only", async () => {
    const n = await saveNote({ start: 1, body: "local" });
    const file = (await buildBackup())!;
    const older = structuredClone(file);
    older.data.notes[0].body = "from file";
    older.data.notes[0].updatedAt = n!.updatedAt - 1000;
    older.data.notes.push({ ...older.data.notes[0], id: "other", body: "extra", updatedAt: 1 });
    await importBackup(older, "merge");
    expect((await listNotes()).map((x) => x.body).sort()).toEqual(["extra", "local"]);
    const newer = structuredClone(file);
    newer.data.notes[0].body = "newer";
    newer.data.notes[0].updatedAt = n!.updatedAt + 1000;
    await importBackup(newer, "merge");
    expect((await listNotes()).find((x) => x.id === n!.id)?.body).toBe("newer");
    await importBackup(older, "replace");
    expect((await listNotes()).map((x) => x.body).sort()).toEqual(["extra", "from file"]);
  });
});

describe("backup validator", () => {
  const good = () => ({
    app: "bible-study-lab",
    schema: 1,
    exportedAt: "2026-11-20T00:00:00Z",
    data: {
      notes: [{ id: "a", start: 1, end: 2, body: "x", tags: [], kind: "note", createdAt: 1, updatedAt: 1 }],
      highlights: [{ verseId: 5, color: "gold", createdAt: 1, updatedAt: 1 }],
    },
  });
  it("accepts a good file and counts what it holds", () => {
    const r = validateBackup(JSON.stringify(good()));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.counts).toMatchObject({ notes: 1, highlights: 1, bookmarks: 0 });
  });

  const bad: [string, (g: ReturnType<typeof good>) => unknown, RegExp][] = [
    ["not json", () => "{nope", /not valid JSON/],
    ["an array", () => [1, 2], /does not look like/],
    ["another app", (g) => ({ ...g, app: "other" }), /not made by Bible Study Lab/],
    ["no schema", (g) => ({ ...g, schema: undefined }), /version number/],
    ["a newer schema", (g) => ({ ...g, schema: 2 }), /newer version/],
    ["no data", (g) => ({ ...g, data: undefined }), /no data section/],
    ["notes not a list", (g) => ({ ...g, data: { notes: {} } }), /"notes" section is not a list/],
    ["a note with a bad verse", (g) => ({ ...g, data: { notes: [{ ...g.data.notes[0], start: 99999 }] } }), /notes, item 1: the verse range/],
    ["a note whose range runs backwards", (g) => ({ ...g, data: { notes: [{ ...g.data.notes[0], start: 9, end: 2 }] } }), /verse range/],
    ["a note with no body", (g) => ({ ...g, data: { notes: [{ ...g.data.notes[0], body: 5 }] } }), /text is missing/],
    ["an unknown kind", (g) => ({ ...g, data: { notes: [{ ...g.data.notes[0], kind: "poem" }] } }), /unknown kind/],
    ["an unknown highlight color", (g) => ({ ...g, data: { highlights: [{ ...g.data.highlights[0], color: "neon" }] } }), /unknown color/],
    ["tags that are not words", (g) => ({ ...g, data: { notes: [{ ...g.data.notes[0], tags: [1] }] } }), /tags/],
  ];
  it.each(bad)("rejects %s", (_name, mutate, message) => {
    const v = mutate(good());
    const r = validateBackup(typeof v === "string" ? v : JSON.stringify(v));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(message);
  });
  it("has at least 12 malformed cases", () => expect(bad.length).toBeGreaterThanOrEqual(12));
});

describe("storage unavailable", () => {
  it("reports unavailable when IndexedDB cannot open", async () => {
    (await getDb())?.close();
    resetDb();
    const real = globalThis.indexedDB;
    // @ts-expect-error simulate a private window with storage blocked
    globalThis.indexedDB = { open: () => { throw new Error("blocked"); } };
    const db = await getDb();
    expect(db).toBeNull();
    expect(useStoreStatus.getState().state).toBe("unavailable");
    expect(await listNotes()).toEqual([]);
    expect(await saveNote({ start: 1, body: "x" })).toBeNull();
    globalThis.indexedDB = real;
    resetDb();
    vi.restoreAllMocks();
  });
});
