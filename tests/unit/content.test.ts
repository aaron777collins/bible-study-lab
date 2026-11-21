import { describe, expect, it } from "vitest";
import { BOOKS } from "@/lib/canon/books";
import { chapterCount } from "@/lib/canon/canon";
import { parseRef } from "@/lib/canon/parse";
import { overviewFor } from "@/content/books";

describe("book overviews", () => {
  it("has one for every book", () => {
    for (const b of BOOKS) expect(overviewFor(b.osis), b.osis).toBeTruthy();
  });

  it.each(BOOKS.map((b, i) => [b.osis, i] as const))("%s is complete and consistent", (osis, i) => {
    const o = overviewFor(osis)!;
    const n = chapterCount(i);
    expect(o.author.length).toBeGreaterThan(10);
    expect(o.setting.length).toBeGreaterThan(10);
    expect(o.summary.length).toBeGreaterThan(40);
    expect(o.themes.length).toBeGreaterThanOrEqual(3);
    expect(o.themes.length).toBeLessThanOrEqual(5);
    expect(o.keyPassages.length).toBeGreaterThanOrEqual(3);
    expect(o.keyPassages.length).toBeLessThanOrEqual(5);
    // outline covers chapter 1 to the last chapter with no gaps or overlaps
    let next = 1;
    for (const [range] of o.outline) {
      const m = /^(\d+)(?:-(\d+))?$/.exec(range);
      expect(m, `${osis} range ${range}`).toBeTruthy();
      const a = Number(m![1]);
      const b = Number(m![2] ?? m![1]);
      expect(a, `${osis} outline starts at ${a}, expected ${next}`).toBe(next);
      expect(b).toBeGreaterThanOrEqual(a);
      next = b + 1;
    }
    expect(next - 1, `${osis} outline ends at ${next - 1}, book has ${n}`).toBe(n);
    // every key passage is a real passage in the same book
    for (const ref of o.keyPassages) {
      const r = parseRef(ref);
      expect(r.ok, `${osis}: ${ref} ${r.ok ? "" : r.error}`).toBe(true);
      if (r.ok) expect(BOOKS[r.passages[0].book].osis, `${osis}: ${ref} is in another book`).toBe(osis);
    }
    // plain writing: no em or en dashes in prose
    const prose = [o.author, o.setting, o.summary, ...o.themes, ...o.outline.map((x) => x[1])].join(" ");
    expect(prose).not.toMatch(/[–—]/);
  });

  it("names authors as tradition, not fact", () => {
    for (const b of BOOKS) {
      const a = overviewFor(b.osis)!.author;
      expect(/^(Traditionally attributed to|The author is not named|Tradition)/.test(a), `${b.osis}: ${a}`).toBe(true);
    }
  });
});
