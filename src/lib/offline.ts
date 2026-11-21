import { dataUrl, getJson } from "@/lib/data/load";

export const DATA_CACHE = "bsl-data-v1";

export interface FileGroup {
  id: string;
  label: string;
  files: string[];
  gzipBytes: number;
}
export const loadGroups = () => getJson<{ groups: FileGroup[] }>("files.json").then((j) => j.groups);

export const cachesSupported = () => typeof caches !== "undefined";

export function formatSize(bytes: number): string {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(bytes >= 1e7 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

const absolute = (p: string) => new URL(dataUrl(p), location.href).href;

/** Download every file in the chosen groups into the cache the service worker serves from. */
export async function downloadGroups(groups: FileGroup[], onProgress: (done: number, total: number) => void, signal?: AbortSignal): Promise<void> {
  const cache = await caches.open(DATA_CACHE);
  const files = groups.flatMap((g) => g.files);
  let done = 0;
  onProgress(0, files.length);
  let i = 0;
  const worker = async () => {
    while (i < files.length) {
      if (signal?.aborted) return;
      const f = files[i++];
      const url = absolute(f);
      if (!(await cache.match(url))) {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Could not download ${f} (${res.status})`);
        await cache.put(url, res);
      }
      onProgress(++done, files.length);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
}

export async function removeGroups(groups: FileGroup[]): Promise<void> {
  const cache = await caches.open(DATA_CACHE);
  for (const f of groups.flatMap((g) => g.files)) await cache.delete(absolute(f));
}

/** For each group, how many of its files are saved on this device. */
export async function savedCounts(groups: FileGroup[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!cachesSupported()) return out;
  const cache = await caches.open(DATA_CACHE);
  const keys = new Set((await cache.keys()).map((r) => r.url));
  for (const g of groups) out[g.id] = g.files.filter((f) => keys.has(absolute(f))).length;
  return out;
}

export async function storageSummary(): Promise<{ usage?: number; quota?: number; persisted?: boolean }> {
  try {
    const est = await navigator.storage?.estimate?.();
    const persisted = await navigator.storage?.persisted?.();
    return { usage: est?.usage, quota: est?.quota, persisted };
  } catch {
    return {};
  }
}
