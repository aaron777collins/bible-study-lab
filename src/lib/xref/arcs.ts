/** Geometry for arc diagrams: pure functions so they can be tested without a canvas. */

export interface Arc {
  /** positions in domain units (verse ids, or book slot numbers) */
  a: number;
  b: number;
  /** weight: votes, or total votes for a book pair */
  w: number;
  /** true when the link points to later text */
  fwd: boolean;
  /** extra data for tooltips: source and target ids */
  from: number;
  to: number;
}

export interface View {
  width: number;
  /** height of the arc area above the baseline */
  height: number;
  domain: number;
  /** horizontal zoom and pan, as in d3-zoom */
  k: number;
  tx: number;
}

export const px = (v: View, pos: number) => (pos / v.domain) * v.width * v.k + v.tx;

/** Vertical squash so the widest arc just fits the drawing area. */
export function yScale(v: View): number {
  return Math.min(1, v.height / (v.width / 2));
}

export interface ArcShape {
  x1: number;
  rx: number;
  ry: number;
}
export function shape(v: View, arc: Arc): ArcShape {
  const x1 = px(v, Math.min(arc.a, arc.b));
  const x2 = px(v, Math.max(arc.a, arc.b));
  const rx = Math.max(0.5, (x2 - x1) / 2);
  return { x1, rx, ry: Math.min(rx * yScale(v) * (v.k > 1 ? Math.max(1, 1) : 1), v.height) };
}

/** Opacity from votes on a log scale, in 5 steps so arcs can be drawn in batches. */
export function alphaStep(w: number, maxW: number): number {
  if (maxW <= 1) return 4;
  const t = Math.log(Math.max(1, w)) / Math.log(maxW);
  return Math.max(0, Math.min(4, Math.floor(t * 5)));
}
export const ALPHAS = [0.07, 0.13, 0.22, 0.36, 0.55];

/** The strongest arc whose outline passes within tol pixels of (x, y), measured from the baseline. */
export function hitArc(arcs: Arc[], v: View, x: number, y: number, tol = 4): Arc | null {
  if (y < 0 || y > v.height + tol) return null;
  let best: Arc | null = null;
  for (const arc of arcs) {
    const x1 = px(v, Math.min(arc.a, arc.b));
    const x2 = px(v, Math.max(arc.a, arc.b));
    if (x < x1 - tol || x > x2 + tol) continue;
    const rx = Math.max(0.5, (x2 - x1) / 2);
    const ry = Math.min(rx * yScale(v), v.height);
    const dx = (x - (x1 + rx)) / rx;
    const dy = y / ry;
    const d = Math.hypot(dx, dy);
    // distance from the outline in pixels, approximately
    const px_ = Math.abs(d - 1) * Math.min(rx, ry);
    if (px_ <= tol && (!best || arc.w > best.w)) best = arc;
  }
  return best;
}

/** Positions for the 66 book segments (or any weighted segments) along a unit domain. */
export function segments(sizes: number[]): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  let at = 0;
  for (const s of sizes) {
    out.push({ start: at, end: at + s });
    at += s;
  }
  return out;
}
