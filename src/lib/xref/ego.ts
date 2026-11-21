import { bookOfId } from "@/lib/canon/canon";
import { BOOKS } from "@/lib/canon/books";
import type { XLink } from "./links";

export interface EgoNode {
  id: number;
  ring: 0 | 1 | 2;
  /** votes of the link that brought this node in (the strongest for the center) */
  votes: number;
  parent: number | null;
  testament: "ot" | "nt";
}
export interface EgoEdge {
  source: number;
  target: number;
  votes: number;
}

export const MAX_EGO_NODES = 60;

/**
 * The center, its strongest links, and optionally the strongest links of each of those.
 * Verses are never repeated, and the whole graph stays under MAX_EGO_NODES.
 */
export function buildEgo(center: number, ring1: XLink[], ring2: Map<number, XLink[]> | null, firstRing = 12, secondRing = 4): { nodes: EgoNode[]; edges: EgoEdge[] } {
  const nodes: EgoNode[] = [{ id: center, ring: 0, votes: 0, parent: null, testament: BOOKS[bookOfId(center)].testament }];
  const edges: EgoEdge[] = [];
  const seen = new Set<number>([center]);
  const first = ring1.filter((l) => l.votes > 0).slice(0, firstRing);
  for (const l of first) {
    if (seen.has(l.id)) continue;
    seen.add(l.id);
    nodes.push({ id: l.id, ring: 1, votes: l.votes, parent: center, testament: BOOKS[bookOfId(l.id)].testament });
    edges.push({ source: center, target: l.id, votes: l.votes });
  }
  nodes[0].votes = Math.max(0, ...first.map((l) => l.votes));
  if (ring2) {
    for (const n of nodes.filter((x) => x.ring === 1)) {
      let added = 0;
      for (const l of ring2.get(n.id) ?? []) {
        if (nodes.length >= MAX_EGO_NODES) break;
        if (l.votes <= 0) continue;
        if (seen.has(l.id)) {
          // a link between two nodes we already have is still worth drawing
          if (l.id !== center && l.id !== n.id) edges.push({ source: n.id, target: l.id, votes: l.votes });
          continue;
        }
        if (added >= secondRing) break;
        seen.add(l.id);
        added++;
        nodes.push({ id: l.id, ring: 2, votes: l.votes, parent: n.id, testament: BOOKS[bookOfId(l.id)].testament });
        edges.push({ source: n.id, target: l.id, votes: l.votes });
      }
    }
  }
  return { nodes, edges };
}
