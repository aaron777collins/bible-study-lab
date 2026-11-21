import { wrap, type Remote } from "comlink";
import type { SearchApi, SearchRequest, SearchResponse } from "@/workers/search.worker";

let api: Remote<SearchApi> | null = null;
const base = () => new URL(`${import.meta.env.BASE_URL}data/v1/`, location.href).href;

function get(): Remote<SearchApi> {
  if (!api) api = wrap<SearchApi>(new Worker(new URL("../../workers/search.worker.ts", import.meta.url), { type: "module" }));
  return api;
}

/** Start building the index for a translation before the person has typed anything. */
export function warmSearch(tr: string): Promise<void> {
  return get().ready(base(), tr);
}

export function runSearch(req: Omit<SearchRequest, "base">): Promise<SearchResponse> {
  return get().search({ ...req, base: base() });
}
