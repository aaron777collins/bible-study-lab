// @vitest-environment node
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.resolve(import.meta.dirname, "../../src/styles/globals.css"), "utf8");

/** Pull the custom properties out of one block, found by its selector. */
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`no ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 1;
  let i = open + 1;
  while (depth && i < css.length) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") depth--;
    i++;
  }
  const body = css.slice(open + 1, i - 1);
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]] = m[2].toLowerCase();
  return out;
}

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const day = tokens(":root {");
const night = tokens(':root[data-theme="dark"]');
const nightMedia = tokens(':root:not([data-theme="light"])');
const COLORS = ["gold", "sky", "olive", "rose", "lavender", "stone"];

describe("theme contrast (WCAG AA)", () => {
  it("defines the same dark tokens for the system choice and the explicit choice", () => {
    for (const k of Object.keys(night)) expect(nightMedia[k], k).toBe(night[k]);
  });

  for (const [name, t] of [["Day", day], ["Vigil", night]] as const) {
    describe(name, () => {
      it("ink on the page and surface is at least 7:1", () => {
        expect(contrast(t.ink, t.page)).toBeGreaterThanOrEqual(7);
        expect(contrast(t.ink, t.surface)).toBeGreaterThanOrEqual(7);
      });
      it("muted text is at least 4.5:1 on page, surface and wash", () => {
        for (const bg of [t.page, t.surface, t.wash]) expect(contrast(t["ink-muted"], bg), `muted on ${bg}`).toBeGreaterThanOrEqual(4.5);
      });
      it("links and active states (lapis) are at least 4.5:1", () => {
        for (const bg of [t.page, t.surface, t["lapis-wash"]]) expect(contrast(t.lapis, bg), `lapis on ${bg}`).toBeGreaterThanOrEqual(4.5);
      });
      it("button text on lapis is at least 4.5:1", () => {
        expect(contrast(t["on-lapis"], t.lapis)).toBeGreaterThanOrEqual(4.5);
      });
      it("rubric (words of Jesus) is at least 4.5:1", () => {
        for (const bg of [t.page, t.surface]) expect(contrast(t.rubric, bg)).toBeGreaterThanOrEqual(4.5);
      });
      it("error text is at least 4.5:1", () => {
        expect(contrast(t.danger, t.surface)).toBeGreaterThanOrEqual(4.5);
      });
      it("gilt is at least 3:1 for graphics", () => {
        expect(contrast(t.gilt, t.surface)).toBeGreaterThanOrEqual(3);
        expect(contrast(t.gilt, t.page)).toBeGreaterThanOrEqual(3);
      });
      it("borders are visible enough to see a control (1.2:1)", () => {
        expect(contrast(t.rule, t.page)).toBeGreaterThanOrEqual(1.1);
      });
      for (const c of COLORS) {
        it(`body text over the ${c} highlight is at least 4.5:1`, () => {
          expect(contrast(t.ink, t[`hl-${c}`])).toBeGreaterThanOrEqual(4.5);
          expect(contrast(t.rubric, t[`hl-${c}`]), "red letters over a highlight").toBeGreaterThanOrEqual(3);
        });
        it(`the ${c} margin mark is at least 3:1 on the page`, () => {
          expect(contrast(t[`hl-${c}-mark`], t.surface)).toBeGreaterThanOrEqual(3);
        });
      }
    });
  }
});
