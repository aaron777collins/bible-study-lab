/** Undirected graph of strong cross references in compressed sparse row form, and path finding on it. */

export interface Graph {
  nodes: number;
  /** offsets[n]..offsets[n+1] index into targets and weights */
  offsets: Uint32Array;
  targets: Uint16Array;
  weights: Uint16Array;
}

/** edges is a flat list of [from, to, votes] triples. Duplicates keep the highest vote count. */
export function buildGraph(edges: ArrayLike<number>, nodes = 31102): Graph {
  const best = new Map<number, number>();
  const key = (a: number, b: number) => (a < b ? a * 65536 + b : b * 65536 + a);
  for (let i = 0; i < edges.length; i += 3) {
    const a = edges[i];
    const b = edges[i + 1];
    if (a === b) continue;
    const k = key(a, b);
    const w = edges[i + 2];
    if ((best.get(k) ?? 0) < w) best.set(k, w);
  }
  const deg = new Uint32Array(nodes + 1);
  for (const k of best.keys()) {
    deg[Math.floor(k / 65536)]++;
    deg[k % 65536]++;
  }
  const offsets = new Uint32Array(nodes + 1);
  for (let i = 0; i < nodes; i++) offsets[i + 1] = offsets[i] + deg[i];
  const fill = offsets.slice(0, nodes);
  const targets = new Uint16Array(offsets[nodes]);
  const weights = new Uint16Array(offsets[nodes]);
  const keys = [...best.keys()].sort((x, y) => x - y);
  for (const k of keys) {
    const a = Math.floor(k / 65536);
    const b = k % 65536;
    const w = best.get(k)!;
    targets[fill[a]] = b;
    weights[fill[a]++] = w;
    targets[fill[b]] = a;
    weights[fill[b]++] = w;
  }
  return { nodes, offsets, targets, weights };
}

export interface PathStep {
  id: number;
  /** votes of the link that leads into this verse (0 for the first verse) */
  votes: number;
}
export interface PathResult {
  /** number of links in the shortest route, or -1 when none was found */
  steps: number;
  /** the best path first: the shortest route whose weakest link is as strong as possible */
  paths: PathStep[][];
  /** verses linked directly to both ends, strongest first */
  shared: { id: number; votes: number }[];
}

const bottleneck = (p: PathStep[]) => Math.min(...p.slice(1).map((s) => s.votes));

/**
 * Fewest steps from a to b using only links with at least minVotes votes, at most maxSteps long.
 * Among shortest routes the first result has the strongest weakest link. Ties are broken by verse order.
 */
export function findPaths(g: Graph, a: number, b: number, minVotes: number, maxSteps = 8, maxAlternatives = 3): PathResult {
  const none: PathResult = { steps: -1, paths: [], shared: [] };
  if (a === b) return { steps: 0, paths: [[{ id: a, votes: 0 }]], shared: [] };
  const distA = new Int16Array(g.nodes).fill(-1);
  let frontier = [a];
  distA[a] = 0;
  let depth = 0;
  while (frontier.length && distA[b] < 0 && depth < maxSteps) {
    depth++;
    const next: number[] = [];
    for (const n of frontier) {
      for (let i = g.offsets[n]; i < g.offsets[n + 1]; i++) {
        if (g.weights[i] < minVotes) continue;
        const t = g.targets[i];
        if (distA[t] < 0) {
          distA[t] = depth;
          next.push(t);
        }
      }
    }
    frontier = next;
  }
  const shared = sharedNeighbours(g, a, b, minVotes);
  if (distA[b] < 0) return { ...none, shared };
  const D = distA[b];
  // Walk back from b to find nodes that lie on some shortest route
  const onPath = new Uint8Array(g.nodes);
  onPath[b] = 1;
  let layer = [b];
  for (let d = D; d > 0; d--) {
    const prev: number[] = [];
    for (const n of layer) {
      for (let i = g.offsets[n]; i < g.offsets[n + 1]; i++) {
        const t = g.targets[i];
        if (g.weights[i] >= minVotes && distA[t] === d - 1 && !onPath[t]) {
          onPath[t] = 1;
          prev.push(t);
        }
      }
    }
    layer = prev;
  }
  // Widest shortest path: best[n] is the largest possible weakest link on a shortest route a..n
  const best = new Int32Array(g.nodes).fill(-1);
  const pred = new Int32Array(g.nodes).fill(-1);
  best[a] = 1 << 30;
  const byDist: number[][] = Array.from({ length: D + 1 }, () => []);
  for (let n = 0; n < g.nodes; n++) if (onPath[n] && distA[n] >= 0 && distA[n] <= D) byDist[distA[n]].push(n);
  byDist[0] = [a];
  for (let d = 1; d <= D; d++) {
    for (const n of byDist[d]) {
      for (let i = g.offsets[n]; i < g.offsets[n + 1]; i++) {
        const p = g.targets[i];
        if (distA[p] !== d - 1 || best[p] < 0 || g.weights[i] < minVotes) continue;
        const w = Math.min(best[p], g.weights[i]);
        if (w > best[n] || (w === best[n] && p < pred[n])) {
          best[n] = w;
          pred[n] = p;
        }
      }
    }
  }
  const weightBetween = (x: number, y: number) => {
    for (let i = g.offsets[x]; i < g.offsets[x + 1]; i++) if (g.targets[i] === y) return g.weights[i];
    return 0;
  };
  const trace: number[] = [];
  for (let n = b; n >= 0; n = pred[n]) {
    trace.push(n);
    if (n === a) break;
  }
  trace.reverse();
  const main: PathStep[] = trace.map((id, i) => ({ id, votes: i === 0 ? 0 : weightBetween(trace[i - 1], id) }));
  const paths: PathStep[][] = [main];

  // A few alternatives: depth first over the shortest-route graph, strongest links first
  const found: PathStep[][] = [];
  const sig = (p: PathStep[]) => p.map((s) => s.id).join(",");
  const seen = new Set([sig(main)]);
  let budget = 4000;
  const stack: PathStep[] = [{ id: a, votes: 0 }];
  const dfs = (n: number) => {
    if (budget-- <= 0) return;
    if (n === b) {
      const s = sig(stack);
      if (!seen.has(s)) {
        seen.add(s);
        found.push(stack.map((x) => ({ ...x })));
      }
      return;
    }
    const nexts: [number, number][] = [];
    for (let i = g.offsets[n]; i < g.offsets[n + 1]; i++) {
      const t = g.targets[i];
      if (onPath[t] && distA[t] === distA[n] + 1 && g.weights[i] >= minVotes) nexts.push([t, g.weights[i]]);
    }
    nexts.sort((x, y) => y[1] - x[1] || x[0] - y[0]);
    for (const [t, w] of nexts.slice(0, 6)) {
      stack.push({ id: t, votes: w });
      dfs(t);
      stack.pop();
    }
  };
  if (D > 1) dfs(a);
  found.sort((x, y) => bottleneck(y) - bottleneck(x) || sig(x).localeCompare(sig(y)));
  paths.push(...found.slice(0, maxAlternatives));
  return { steps: D, paths, shared };
}

export function sharedNeighbours(g: Graph, a: number, b: number, minVotes: number, limit = 10) {
  const wa = new Map<number, number>();
  for (let i = g.offsets[a]; i < g.offsets[a + 1]; i++) if (g.weights[i] >= minVotes) wa.set(g.targets[i], g.weights[i]);
  const out: { id: number; votes: number }[] = [];
  for (let i = g.offsets[b]; i < g.offsets[b + 1]; i++) {
    const t = g.targets[i];
    if (g.weights[i] >= minVotes && wa.has(t) && t !== a && t !== b) out.push({ id: t, votes: Math.min(wa.get(t)!, g.weights[i]) });
  }
  return out.sort((x, y) => y.votes - x.votes || x.id - y.id).slice(0, limit);
}
