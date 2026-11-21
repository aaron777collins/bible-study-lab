import { getDb, useStoreStatus } from "./db";
import { DAY } from "./types";

export interface MetaState {
  firstWriteAt?: number;
  lastExportAt?: number;
  changesSinceExport: number;
  warnedAt?: number;
  persistRequested?: boolean;
  persistGranted?: boolean;
}

export async function readMeta(): Promise<MetaState> {
  const db = await getDb();
  const state: MetaState = { changesSinceExport: 0 };
  if (!db) return state;
  const rows = await db.getAll("meta");
  for (const { key, value } of rows) {
    if (key === "firstWriteAt") state.firstWriteAt = value as number;
    else if (key === "lastExportAt") state.lastExportAt = value as number;
    else if (key === "changesSinceExport") state.changesSinceExport = (value as number) ?? 0;
    else if (key === "warnedAt") state.warnedAt = value as number;
    else if (key === "persistRequested") state.persistRequested = value as boolean;
    else if (key === "persistGranted") state.persistGranted = value as boolean;
  }
  return state;
}

export async function setMeta(key: string, value: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.put("meta", { key, value });
}

/** Call after any user write: remembers the first write and counts changes since the last export. */
export async function noteChange(count = 1) {
  const db = await getDb();
  if (!db) return;
  const tx = db.transaction("meta", "readwrite");
  const first = await tx.store.get("firstWriteAt");
  if (!first) await tx.store.put({ key: "firstWriteAt", value: Date.now() });
  const c = await tx.store.get("changesSinceExport");
  await tx.store.put({ key: "changesSinceExport", value: ((c?.value as number) ?? 0) + count });
  await tx.done;
  useStoreStatus.getState().bump();
}

export async function markExported() {
  const db = await getDb();
  if (!db) return;
  const tx = db.transaction("meta", "readwrite");
  await tx.store.put({ key: "lastExportAt", value: Date.now() });
  await tx.store.put({ key: "changesSinceExport", value: 0 });
  await tx.done;
  useStoreStatus.getState().bump();
}

/**
 * Remind until the first export, then again after 30 days or 25 changes.
 * Nothing to remind about until something has been saved.
 */
export function shouldRemindExport(meta: MetaState, now = Date.now()): boolean {
  if (!meta.firstWriteAt) return false;
  if (!meta.lastExportAt) return true;
  return now - meta.lastExportAt >= 30 * DAY || meta.changesSinceExport >= 25;
}

/** Ask the browser to keep our storage. Returns true when it agreed. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    const already = await navigator.storage.persisted?.();
    const granted = already || (await navigator.storage.persist());
    await setMeta("persistRequested", true);
    await setMeta("persistGranted", !!granted);
    return !!granted;
  } catch {
    return false;
  }
}
