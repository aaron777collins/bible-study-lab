import { highlightPieces } from "@/lib/search/query";

export function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightPieces(text, terms).map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded-sm px-0.5" style={{ background: "var(--hl-gold)", color: "var(--ink)" }}>{p.t}</mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </>
  );
}
