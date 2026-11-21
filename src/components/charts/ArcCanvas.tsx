import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from "d3-zoom";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOKS } from "@/lib/canon/books";
import { ALPHAS, alphaStep, hitArc, px, yScale, type Arc, type View } from "@/lib/xref/arcs";

export interface Segment {
  start: number;
  end: number;
  label: string;
  short: string;
  testament: "ot" | "nt";
  key: number;
}

const osisOf = (s: Segment) => BOOKS[s.key].osis;

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function useThemeVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => setV((n) => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return v;
}

/**
 * Arc diagram on a canvas, with a clickable, keyboard friendly band of segments underneath.
 * Links that point forward in the text are lapis, links that point back are gilt.
 */
export function ArcCanvas({
  arcs,
  domain,
  segments,
  focusSegment,
  onFocusSegment,
  onOpenSegment,
  describe,
  onArcClick,
  height = 300,
  label,
  zoomable = true,
  heat,
}: {
  arcs: Arc[];
  domain: number;
  segments: Segment[];
  focusSegment: number | null;
  onFocusSegment: (key: number | null) => void;
  onOpenSegment: (key: number) => void;
  describe: (arc: Arc) => string;
  onArcClick?: (arc: Arc) => void;
  height?: number;
  label: string;
  zoomable?: boolean;
  /** optional 0 to 1 value per segment key, shown as a deeper blue band */
  heat?: number[];
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(800);
  const [t, setT] = useState({ k: 1, tx: 0 });
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const theme = useThemeVersion();
  const zoomRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const tabStop = useRef(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(280, Math.floor(el.clientWidth))));
    ro.observe(el);
    setWidth(Math.max(280, Math.floor(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  const view: View = useMemo(() => ({ width, height, domain, k: t.k, tx: t.tx }), [width, height, domain, t]);
  const maxW = useMemo(() => arcs.reduce((m, a) => Math.max(m, a.w), 1), [arcs]);
  const highlighted = useMemo(() => {
    if (focusSegment === null) return null;
    const seg = segments.find((s) => s.key === focusSegment);
    return seg ?? null;
  }, [focusSegment, segments]);

  // draw
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.floor(width * dpr);
    c.height = Math.floor((height + 2) * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height + 2);
    const fwd = cssVar("--lapis", "#2a4a96");
    const back = cssVar("--gilt", "#9c7413");
    const ys = yScale(view);
    // many arcs overlap, so make each one fainter
    const density = Math.min(1, Math.max(0.1, 5000 / Math.max(1, arcs.length)));
    const base = height;
    const hl = highlighted;
    const inHl = (a: Arc) => !hl || (Math.min(a.a, a.b) < hl.end && Math.max(a.a, a.b) >= hl.start) || (a.a >= hl.start && a.a < hl.end) || (a.b >= hl.start && a.b < hl.end);
    // batches: [direction][alpha step][dim or not]
    for (const dimPass of hl ? [true, false] : [false]) {
      for (const dir of [true, false]) {
        for (let step = 0; step < 5; step++) {
          ctx.beginPath();
          let any = false;
          for (const a of arcs) {
            if (a.fwd !== dir || alphaStep(a.w, maxW) !== step) continue;
            const on = inHl(a);
            if (hl ? on === dimPass : false) continue;
            const x1 = px(view, Math.min(a.a, a.b));
            const x2 = px(view, Math.max(a.a, a.b));
            if (x2 < 0 || x1 > width) continue;
            const rx = (x2 - x1) / 2;
            if (rx < 0.4) continue;
            ctx.moveTo(x1, base);
            ctx.ellipse(x1 + rx, base, rx, Math.min(rx * ys, height), 0, Math.PI, 2 * Math.PI);
            any = true;
          }
          if (!any) continue;
          ctx.strokeStyle = dir ? fwd : back;
          const dim = hl && dimPass;
          ctx.globalAlpha = dim ? ALPHAS[step] * density * 0.35 : hl ? Math.min(1, ALPHAS[step] * density * 4 + 0.08) : Math.min(1, ALPHAS[step] * density * (step >= 3 ? 1.6 : 1) * (dir ? 1.5 : 1));
          ctx.lineWidth = hl && !dimPass ? 1.1 : 0.8;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }, [arcs, view, width, height, maxW, highlighted, theme]);

  // zoom and pan
  useEffect(() => {
    const c = canvas.current;
    if (!c || !zoomable) return;
    const z = d3zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([1, 24])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .filter((e: Event) => (e.type === "wheel" ? (e as WheelEvent).ctrlKey || (e as WheelEvent).metaKey : !(e as MouseEvent).button))
      .on("zoom", (e: D3ZoomEvent<HTMLCanvasElement, unknown>) => setT({ k: e.transform.k, tx: e.transform.x }));
    zoomRef.current = z;
    select(c).call(z);
    return () => {
      select(c).on(".zoom", null);
    };
  }, [width, height, zoomable]);

  const zoomBy = (f: number) => {
    const c = canvas.current;
    if (c && zoomRef.current) select(c).call(zoomRef.current.scaleBy, f);
  };
  const reset = () => {
    const c = canvas.current;
    if (c && zoomRef.current) select(c).call(zoomRef.current.transform, zoomIdentity);
  };

  const raf = useRef(0);
  const onMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = height - (e.clientY - rect.top);
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const hit = hitArc(arcs, view, x, y, 5);
        setTip(hit ? { x, y: e.clientY - rect.top, text: describe(hit) } : null);
      });
    },
    [arcs, view, height, describe],
  );
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hit = hitArc(arcs, view, e.clientX - rect.left, height - (e.clientY - rect.top), 6);
    if (hit) onArcClick?.(hit);
  };

  const onBandKey = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -999 : e.key === "End" ? 999 : 0;
    if (!step) return;
    e.preventDefault();
    const n = Math.max(0, Math.min(segments.length - 1, i + step));
    tabStop.current = n;
    (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="grid gap-2">
      <div ref={wrap} className="relative w-full select-none">
        <canvas
          ref={canvas}
          role="img"
          aria-label={label}
          style={{ width, height: height + 2, display: "block", touchAction: "pan-y" }}
          onPointerMove={onMove}
          onPointerLeave={() => setTip(null)}
          onClick={onClick}
          data-testid="arc-canvas"
        />
        {tip && (
          <div className="chart-tip absolute z-10 max-w-64 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md" style={{ left: Math.min(Math.max(8, tip.x + 10), width - 200), top: Math.max(0, tip.y - 36) }} role="status">
            {tip.text}
          </div>
        )}
        <div className="relative h-9 border-t" role="group" aria-label={`${label}: books, use the arrow keys to move`} onMouseLeave={() => onFocusSegment(null)}>
          {segments.map((s, i) => {
            const x1 = px(view, s.start);
            const x2 = px(view, s.end);
            if (x2 < -2 || x1 > width + 2) return null;
            const w = x2 - x1;
            return (
              <button
                key={s.key}
                type="button"
                tabIndex={i === tabStop.current ? 0 : -1}
                aria-label={s.label}
                aria-pressed={focusSegment === s.key}
                title={s.label}
                className="absolute top-0 h-full overflow-hidden border-r px-0.5 text-center text-[11px] font-medium leading-9 outline-offset-[-2px]"
                style={{ left: x1, width: Math.max(1, w), background: focusSegment === s.key ? "var(--lapis-wash)" : heat ? `color-mix(in oklab, var(--lapis) ${Math.round((heat[s.key] ?? 0) * 55)}%, var(--surface))` : s.testament === "ot" ? "var(--wash)" : "var(--surface)", color: "var(--ink)", borderColor: "var(--rule)" }}
                onMouseEnter={() => onFocusSegment(s.key)}
                onFocus={() => {
                  tabStop.current = i;
                  onFocusSegment(s.key);
                }}
                onBlur={() => onFocusSegment(null)}
                onClick={() => onOpenSegment(s.key)}
                onKeyDown={(e) => onBandKey(e, i)}
              >
                {w > 92 ? s.label : w > 30 ? (heat ? s.short : osisOf(s)) : ""}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-5" style={{ background: "var(--lapis)" }} aria-hidden="true" /> points to later text</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-0.5 w-5" style={{ background: "var(--gilt)" }} aria-hidden="true" /> points back</span>
        </span>
        {zoomable && (
          <span className="flex items-center gap-1">
            <Button size="icon-sm" variant="outline" onClick={() => zoomBy(1 / 1.6)} aria-label="Zoom out"><Minus aria-hidden="true" /></Button>
            <Button size="icon-sm" variant="outline" onClick={() => zoomBy(1.6)} aria-label="Zoom in"><Plus aria-hidden="true" /></Button>
            <Button size="icon-sm" variant="outline" onClick={reset} aria-label="Reset zoom"><RotateCcw aria-hidden="true" /></Button>
          </span>
        )}
      </div>
    </div>
  );
}
