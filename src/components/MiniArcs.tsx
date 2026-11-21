import { useMemo } from "react";
import { BOOK_START } from "@/lib/canon/canon";
import type { XLink } from "@/lib/xref/links";

/** A small arc picture of one verse and its strongest links. The arcs draw in once, unless motion is reduced. */
export function MiniArcs({ center, links, label }: { center: number; links: XLink[]; label: string }) {
  const W = 600;
  const H = 130;
  const top = useMemo(() => links.filter((l) => l.votes > 0).slice(0, 24), [links]);
  const maxV = Math.max(1, ...top.map((l) => l.votes));
  const x = (id: number) => 12 + (id / 31102) * (W - 24);
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={label} className="h-auto w-full">
      <style>{`
        @keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        .arc-in { stroke-dasharray: 1; stroke-dashoffset: 0; animation: draw 1.1s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .arc-in { animation: none; } }
      `}</style>
      <line x1={12} x2={W - 12} y1={H} y2={H} stroke="var(--rule)" />
      {[39].map((b) => <line key={b} x1={x(BOOK_START[b])} x2={x(BOOK_START[b])} y1={H - 4} y2={H + 4} stroke="var(--ink-muted)" />)}
      <text x={12} y={H + 15} fontSize={10} fill="var(--ink-muted)">Genesis</text>
      <text x={x(BOOK_START[39])} y={H + 15} fontSize={10} textAnchor="middle" fill="var(--ink-muted)">Matthew</text>
      <text x={W - 12} y={H + 15} fontSize={10} textAnchor="end" fill="var(--ink-muted)">Revelation</text>
      {top.map((l, i) => {
        const a = x(center);
        const b = x(l.id);
        const r = Math.abs(b - a) / 2;
        const ry = Math.min(H - 6, r * 0.9);
        const fwd = l.id > center;
        const d = `M ${Math.min(a, b)} ${H} A ${r} ${ry} 0 0 1 ${Math.max(a, b)} ${H}`;
        return (
          <path key={`${l.id}-${i}`} d={d} fill="none" pathLength={1} className="arc-in" style={{ animationDelay: `${i * 35}ms` }} stroke={fwd ? "var(--lapis)" : "var(--gilt)"} strokeOpacity={0.35 + 0.55 * (l.votes / maxV)} strokeWidth={1 + 2.2 * Math.sqrt(l.votes / maxV)} strokeLinecap="round" />
        );
      })}
      <circle cx={x(center)} cy={H} r={4.5} fill="var(--lapis)" />
    </svg>
  );
}
