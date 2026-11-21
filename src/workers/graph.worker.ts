/// <reference lib="webworker" />
import { expose } from "comlink";
import { buildGraph, findPaths, type Graph, type PathResult } from "@/lib/xref/graph";

let graph: Graph | null = null;
let loading: Promise<void> | null = null;

const api = {
  /** Download and build the graph once per session. */
  async init(url: string): Promise<number> {
    if (!loading) {
      loading = (async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Could not load the link graph (${res.status})`);
        graph = buildGraph(new Uint16Array(await res.arrayBuffer()));
      })();
      loading.catch(() => {
        loading = null;
      });
    }
    await loading;
    return graph ? graph.offsets[graph.nodes] / 2 : 0;
  },
  find(a: number, b: number, minVotes: number, maxSteps: number): PathResult {
    if (!graph) throw new Error("The graph is not ready");
    return findPaths(graph, a, b, minVotes, maxSteps);
  },
  degree(id: number, minVotes: number): number {
    if (!graph) return 0;
    let n = 0;
    for (let i = graph.offsets[id]; i < graph.offsets[id + 1]; i++) if (graph.weights[i] >= minVotes) n++;
    return n;
  },
};
export type GraphApi = typeof api;
expose(api);
