import { wrap, type Remote } from "comlink";
import { dataUrl } from "@/lib/data/load";
import type { GraphApi } from "@/workers/graph.worker";

let client: Remote<GraphApi> | null = null;
let ready: Promise<number> | null = null;

/** The path finder runs in a worker so the page stays responsive. The graph is built once per session. */
export function getGraph(): Promise<Remote<GraphApi>> {
  if (!client) {
    const worker = new Worker(new URL("../../workers/graph.worker.ts", import.meta.url), { type: "module" });
    client = wrap<GraphApi>(worker);
  }
  if (!ready) {
    ready = client.init(new URL(dataUrl("xref/edges5.bin"), location.href).href);
    ready.catch(() => {
      ready = null;
    });
  }
  return ready.then(() => client!);
}
