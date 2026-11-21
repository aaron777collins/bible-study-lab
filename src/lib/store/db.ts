import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { create } from "zustand";
import type { Bookmark, Collection, Highlight, MemoryItem, Note, PlanProgress, PlanState } from "./types";

export interface BslDB extends DBSchema {
  notes: { key: string; value: Note; indexes: { "by-start": number; "by-tag": string; "by-kind": string; "by-updated": number } };
  highlights: { key: number; value: Highlight; indexes: { "by-color": string } };
  bookmarks: { key: string; value: Bookmark; indexes: { "by-start": number } };
  collections: { key: string; value: Collection; indexes: { "by-updated": number } };
  plans: { key: string; value: PlanState };
  planProgress: { key: [string, number]; value: PlanProgress; indexes: { "by-plan": string } };
  memory: { key: string; value: MemoryItem; indexes: { "by-due": number } };
  meta: { key: string; value: { key: string; value: unknown } };
}

export const DB_NAME = "bsl";
export const SCHEMA_VERSION = 1;

export type StoreState = "loading" | "ready" | "unavailable";

interface StoreStatus {
  state: StoreState;
  /** bumped after every write so live queries can refresh */
  version: number;
  bump: () => void;
  setState: (s: StoreState) => void;
}
export const useStoreStatus = create<StoreStatus>((set) => ({
  state: "loading",
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
  setState: (state) => set({ state }),
}));

let dbPromise: Promise<IDBPDatabase<BslDB> | null> | null = null;

/** Open the database. Resolves to null when IndexedDB is missing or blocked (some private windows). */
export function getDb(): Promise<IDBPDatabase<BslDB> | null> {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        if (typeof indexedDB === "undefined") throw new Error("no indexedDB");
        const db = await openDB<BslDB>(DB_NAME, SCHEMA_VERSION, {
          upgrade(db) {
            const notes = db.createObjectStore("notes", { keyPath: "id" });
            notes.createIndex("by-start", "start");
            notes.createIndex("by-tag", "tags", { multiEntry: true });
            notes.createIndex("by-kind", "kind");
            notes.createIndex("by-updated", "updatedAt");
            const hl = db.createObjectStore("highlights", { keyPath: "verseId" });
            hl.createIndex("by-color", "color");
            const bm = db.createObjectStore("bookmarks", { keyPath: "id" });
            bm.createIndex("by-start", "start");
            const col = db.createObjectStore("collections", { keyPath: "id" });
            col.createIndex("by-updated", "updatedAt");
            db.createObjectStore("plans", { keyPath: "planId" });
            const pp = db.createObjectStore("planProgress", { keyPath: ["planId", "day"] });
            pp.createIndex("by-plan", "planId");
            const mem = db.createObjectStore("memory", { keyPath: "id" });
            mem.createIndex("by-due", "dueAt");
            db.createObjectStore("meta", { keyPath: "key" });
          },
        });
        // a real write test: some private windows open the database but refuse writes
        await db.put("meta", { key: "schemaVersion", value: SCHEMA_VERSION });
        useStoreStatus.getState().setState("ready");
        return db;
      } catch {
        useStoreStatus.getState().setState("unavailable");
        return null;
      }
    })();
  }
  return dbPromise;
}

/** For tests: forget the open connection. */
export function resetDbForTests() {
  dbPromise = null;
  useStoreStatus.setState({ state: "loading", version: 0 });
}

export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
