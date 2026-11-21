import { formatRange } from "@/lib/canon/parse";
import { fromId } from "@/lib/canon/canon";
import { plain } from "@/lib/data/text";
import { translationById } from "@/lib/translations";

export type CopyFormat = "plain" | "numbered" | "markdown";

export interface CopyInput {
  start: number;
  end: number;
  tr: string;
  /** [verse id, stored verse text] in order */
  verses: [number, string][];
}

export const COPY_FORMAT_LABEL: Record<CopyFormat, string> = { plain: "Text with reference", numbered: "With verse numbers", markdown: "Markdown quote" };

/** Format a passage for pasting into a message, a document or a note. */
export function formatCopy({ start, end, tr, verses }: CopyInput, format: CopyFormat): string {
  const ref = formatRange(start, end > start ? end : 0);
  const short = translationById(tr).short;
  const texts = verses.map(([id, t]) => [id, plain(t)] as const).filter(([, t]) => t);
  if (format === "numbered") {
    const lines = texts.map(([id, t]) => `${fromId(id).verse} ${t}`);
    return `${ref} (${short})\n${lines.join("\n")}`;
  }
  const body = texts.map(([, t]) => t).join(" ");
  if (format === "markdown") return `> ${body}\n>\n> **${ref}** (${short})`;
  return `“${body}” ${ref} ${short}`;
}

/** The absolute address of a path inside this app. Works on GitHub Pages and in dev. */
export function appUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const origin = typeof location !== "undefined" ? location.origin : "https://aaron777collins.github.io";
  return `${origin}${base}#${path.startsWith("/") ? path : `/${path}`}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
