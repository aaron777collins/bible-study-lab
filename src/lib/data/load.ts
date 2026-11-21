/** Fetch static data files once and remember them. Failed loads are not remembered, so a retry works. */
const BASE = `${import.meta.env.BASE_URL}data/v1/`;
const cache = new Map<string, Promise<unknown>>();

export function dataUrl(path: string): string {
  return BASE + path;
}

export function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(BASE + path).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`);
      return r.json() as Promise<T>;
    });
    cache.set(path, p);
    p.catch(() => cache.delete(path));
  }
  return p;
}

export async function getBinary(path: string): Promise<ArrayBuffer> {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`);
  return r.arrayBuffer();
}
