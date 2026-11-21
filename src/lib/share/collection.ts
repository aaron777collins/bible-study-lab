/** Shared collections: a list of passages packed into the link itself, so no server is involved. */
export const SHARE_LIMIT = 2000;

export interface SharedCollection {
  title: string;
  description?: string;
  refs: [number, number][];
}

const toBase64Url = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromBase64Url = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>));
  return new Uint8Array(await out.arrayBuffer());
}

/** Compact JSON: [title, description, [[start, end]...]]. Compressed with deflate when the browser can. */
export async function encodeCollection(c: SharedCollection): Promise<string> {
  const json = JSON.stringify([c.title, c.description ?? "", c.refs.map(([a, b]) => (b > a ? [a, b] : [a]))]);
  const raw = new TextEncoder().encode(json);
  if (typeof CompressionStream !== "undefined") {
    try {
      return "z" + toBase64Url(await pipe(raw, new CompressionStream("deflate-raw")));
    } catch {
      /* fall through */
    }
  }
  return "u" + toBase64Url(raw);
}

export async function decodeCollection(payload: string): Promise<SharedCollection | null> {
  try {
    const kind = payload[0];
    const bytes = fromBase64Url(payload.slice(1));
    let raw: Uint8Array;
    if (kind === "z") {
      if (typeof DecompressionStream === "undefined") return null;
      raw = await pipe(bytes, new DecompressionStream("deflate-raw"));
    } else if (kind === "u") raw = bytes;
    else return null;
    const j = JSON.parse(new TextDecoder().decode(raw));
    if (!Array.isArray(j) || typeof j[0] !== "string" || !Array.isArray(j[2])) return null;
    const refs: [number, number][] = [];
    for (const r of j[2]) {
      if (!Array.isArray(r) || !Number.isInteger(r[0]) || r[0] < 0 || r[0] >= 31102) return null;
      const end = r.length > 1 ? r[1] : r[0];
      if (!Number.isInteger(end) || end < r[0] || end >= 31102) return null;
      refs.push([r[0], end]);
    }
    if (refs.length === 0 || refs.length > 200) return null;
    return { title: j[0].slice(0, 120), description: typeof j[1] === "string" ? j[1].slice(0, 400) : "", refs };
  } catch {
    return null;
  }
}

export type ShareLink = { ok: true; path: string; length: number } | { ok: false; length: number };

/** The route for a shared collection, or a refusal when the payload would be too long to be a good link. */
export async function buildShareLink(c: SharedCollection): Promise<ShareLink> {
  const payload = await encodeCollection(c);
  if (payload.length > SHARE_LIMIT) return { ok: false, length: payload.length };
  return { ok: true, path: `/c/${payload}`, length: payload.length };
}
