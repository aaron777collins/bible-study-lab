import { useMemo } from "react";
import { forceCollide, forceLink, forceManyBody, forceRadial, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import { formatVerseId } from "@/lib/canon/parse";
import type { EgoEdge, EgoNode } from "@/lib/xref/ego";

interface SimNode extends SimulationNodeDatum, EgoNode {}

const W = 640;
const H = 520;

/** The verse in the middle, its strongest links around it. Positions are computed once and the layout then stays still. */
export function EgoGraph({ nodes, edges, selected, onSelect, onCenter }: { nodes: EgoNode[]; edges: EgoEdge[]; selected: number | null; onSelect: (id: number) => void; onCenter: (id: number) => void }) {
  const layout = useMemo(() => {
    const sim: SimNode[] = nodes.map((n, i) => {
      // start on rings so the result is the same every time
      const idx = nodes.filter((x) => x.ring === n.ring).indexOf(n);
      const count = nodes.filter((x) => x.ring === n.ring).length;
      const a = (idx / Math.max(1, count)) * Math.PI * 2 + (n.ring === 2 ? 0.3 : 0);
      const r = n.ring === 0 ? 0 : n.ring === 1 ? 150 : 235;
      return { ...n, x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, index: i, ...(n.ring === 0 ? { fx: W / 2, fy: H / 2 } : {}) };
    });
    const byId = new Map(sim.map((n) => [n.id, n]));
    const links: SimulationLinkDatum<SimNode>[] = edges.filter((e) => byId.has(e.source) && byId.has(e.target)).map((e) => ({ source: byId.get(e.source)!, target: byId.get(e.target)! }));
    const s = forceSimulation(sim)
      .force("link", forceLink<SimNode, SimulationLinkDatum<SimNode>>(links).distance((l) => ((l.target as SimNode).ring === 2 ? 70 : 130)).strength(0.5))
      .force("charge", forceManyBody().strength(-230))
      .force("collide", forceCollide<SimNode>().radius((n) => radius(n) + 16))
      .force("radial", forceRadial<SimNode>((n) => (n.ring === 0 ? 0 : n.ring === 1 ? 155 : 240), W / 2, H / 2).strength(0.35))
      .stop();
    s.tick(300);
    return { sim, byId };
  }, [nodes, edges]);

  const maxVotes = Math.max(1, ...edges.map((e) => e.votes));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Network of connected verses. The same links are listed in text beside it." className="h-auto w-full max-w-full" data-testid="ego-graph">
      <g>
        {edges.map((e, i) => {
          const a = layout.byId.get(e.source);
          const b = layout.byId.get(e.target);
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--ink-muted)" strokeOpacity={0.25 + 0.5 * (e.votes / maxVotes)} strokeWidth={0.8 + 3.2 * Math.sqrt(e.votes / maxVotes)} />;
        })}
      </g>
      {layout.sim.map((n) => {
        const r = radius(n);
        const isSel = selected === n.id;
        const fill = n.ring === 0 ? "var(--lapis)" : n.testament === "ot" ? "var(--surface)" : "var(--lapis-wash)";
        const stroke = n.testament === "ot" ? "var(--gilt)" : "var(--lapis)";
        const label = formatVerseId(n.id, { short: true });
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            role="button"
            tabIndex={0}
            aria-label={`${formatVerseId(n.id)}${n.ring === 0 ? ", the center" : `, ${n.votes} votes`}. Press Enter to preview, Shift Enter to move here.`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(n.id)}
            onDoubleClick={() => onCenter(n.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (e.shiftKey) onCenter(n.id);
                else onSelect(n.id);
              }
            }}
          >
            {n.testament === "ot" ? (
              <circle r={r} fill={fill} stroke={stroke} strokeWidth={isSel ? 4 : 2.5} />
            ) : (
              <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={3} transform="rotate(45)" fill={fill} stroke={stroke} strokeWidth={isSel ? 4 : 2.5} />
            )}
            <text y={r + 14} textAnchor="middle" fontSize={n.ring === 2 ? 10.5 : 12} fontWeight={n.ring === 0 ? 700 : 500} fill="var(--ink)" paintOrder="stroke" stroke="var(--page)" strokeWidth={3}>
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function radius(n: EgoNode): number {
  if (n.ring === 0) return 17;
  return 6 + Math.min(9, Math.log2(1 + n.votes) * 1.4) - (n.ring === 2 ? 2 : 0);
}
