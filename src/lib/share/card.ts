export type CardStyle = "day" | "vigil" | "lapis";
export type CardSize = "square" | "story" | "wide";

export const CARD_SIZES: Record<CardSize, [number, number]> = { square: [1080, 1080], story: [1080, 1920], wide: [1200, 630] };
export const CARD_SIZE_LABEL: Record<CardSize, string> = { square: "Square", story: "Story", wide: "Wide link preview" };
export const CARD_STYLE_LABEL: Record<CardStyle, string> = { day: "Day", vigil: "Vigil", lapis: "Lapis" };

const PALETTE: Record<CardStyle, { bg: string; ink: string; muted: string; accent: string; rule: string }> = {
  day: { bg: "#F5F7FA", ink: "#1B2232", muted: "#556075", accent: "#2A4A96", rule: "#9C7413" },
  vigil: { bg: "#0F141E", ink: "#E8E3D7", muted: "#A3AABA", accent: "#94AEF2", rule: "#D9B45A" },
  lapis: { bg: "#2A4A96", ink: "#FFFFFF", muted: "#D5DDF3", accent: "#FFFFFF", rule: "#E2B94A" },
};

export interface FitResult {
  size: number;
  lines: string[];
}

/** Split text into lines no wider than maxWidth, using the given width function. */
export function wrapLines(measure: (s: string) => number, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measure(next) <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Find the largest font size, from maxSize down to minSize, where the wrapped text fits the box.
 * If even minSize does not fit, the text is shortened with an ellipsis so it always fits.
 */
export function fitText(measure: (s: string, size: number) => number, text: string, maxWidth: number, maxHeight: number, opts: { minSize?: number; maxSize?: number; lineHeight?: number } = {}): FitResult {
  const { minSize = 26, maxSize = 84, lineHeight = 1.32 } = opts;
  for (let size = maxSize; size >= minSize; size -= 2) {
    const lines = wrapLines((s) => measure(s, size), text, maxWidth);
    if (lines.length * size * lineHeight <= maxHeight) return { size, lines };
  }
  const maxLines = Math.max(1, Math.floor(maxHeight / (minSize * lineHeight)));
  let lines = wrapLines((s) => measure(s, minSize), text, maxWidth);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && measure(`${last}…`, minSize) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  return { size: minSize, lines };
}

export interface CardInput {
  text: string;
  reference: string;
  translation: string;
  style: CardStyle;
  size: CardSize;
}

export async function drawCard(canvas: HTMLCanvasElement, input: CardInput): Promise<void> {
  const [w, h] = CARD_SIZES[input.size];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");
  const pal = PALETTE[input.style];
  try {
    await Promise.all([document.fonts.load("400 40px 'Gentium Book Plus'"), document.fonts.load("italic 400 40px 'Gentium Book Plus'"), document.fonts.load("600 30px 'Atkinson Hyperlegible Next Variable'")]);
  } catch {
    /* fall back to system fonts */
  }
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, w, h);

  const pad = Math.round(w * 0.09);
  const tall = h > w;
  // an arc ornament, a nod to the cross reference view
  ctx.strokeStyle = pal.rule;
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.lineCap = "round";
  const arcR = Math.round(w * 0.06);
  const arcY = pad + arcR;
  ctx.beginPath();
  ctx.arc(pad + arcR, arcY, arcR, Math.PI, 2 * Math.PI);
  ctx.stroke();

  const refSize = Math.round(w * 0.034);
  const footY = h - pad;
  const textTop = arcY + Math.round(h * (tall ? 0.06 : 0.07));
  const textBottom = footY - refSize * 2.6;
  const family = "'Gentium Book Plus', Georgia, serif";
  const measure = (s: string, size: number) => {
    ctx.font = `400 ${size}px ${family}`;
    return ctx.measureText(s).width;
  };
  const fit = fitText(measure, `“${input.text}”`, w - pad * 2, textBottom - textTop, { maxSize: Math.round(w * (tall ? 0.075 : 0.07)), minSize: Math.round(w * 0.026) });
  ctx.fillStyle = pal.ink;
  ctx.font = `400 ${fit.size}px ${family}`;
  ctx.textBaseline = "alphabetic";
  const lh = fit.size * 1.32;
  const blockH = fit.lines.length * lh;
  let y = textTop + Math.max(0, (textBottom - textTop - blockH) / 2) + fit.size;
  for (const line of fit.lines) {
    ctx.fillText(line, pad, y);
    y += lh;
  }

  ctx.fillStyle = pal.accent;
  ctx.font = `600 ${refSize}px 'Atkinson Hyperlegible Next Variable', system-ui, sans-serif`;
  ctx.fillText(`${input.reference} (${input.translation})`, pad, footY - refSize * 0.9);
  ctx.fillStyle = pal.muted;
  ctx.font = `400 ${Math.round(refSize * 0.72)}px 'Atkinson Hyperlegible Next Variable', system-ui, sans-serif`;
  const brand = "Bible Study Lab";
  ctx.textAlign = "right";
  ctx.fillText(brand, w - pad, footY);
  ctx.textAlign = "left";
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not make the image"))), "image/png"));
}
