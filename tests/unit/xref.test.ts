import { describe, expect, it } from "vitest";
import { BOOKS } from "@/lib/canon/books";
import { idFromOsis } from "@/lib/canon/canon";
import { DEFAULT_FILTER, countByBook, filterLinks, mergeLinks, strengthFraction, tierOf, type XLink } from "@/lib/xref/links";
import { buildEgo, MAX_EGO_NODES } from "@/lib/xref/ego";
import { bookArcs, bookTotals, verseArcs } from "@/lib/xref/arcdata";
import { alphaStep, hitArc, segments, type Arc } from "@/lib/xref/arcs";

describe("tiers", () => {
  it.each([
    [20, "strong"], [21, "strong"], [1320, "strong"], [19, "medium"], [5, "medium"], [4, "light"], [1, "light"], [0, "disputed"], [-3, "disputed"],
  ])("%i votes is %s", (votes, tier) => expect(tierOf(votes)).toBe(tier));
});

describe("merging both directions", () => {
  it("shows a pair once with the higher vote and both directions", () => {
    // verse 100 links out to 5000 (12 votes) and is referenced by 5000 (30 votes)
    const merged = mergeLinks([5000, 0, 12, -5001, 0, 30]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 5000, votes: 30, dir: "both" });
  });
  it("keeps out and in links apart when they are different verses", () => {
    const m = mergeLinks([10, 0, 5, -21, 0, 7]);
    expect(m.map((l) => [l.id, l.dir])).toEqual([[20, "in"], [10, "out"]]);
  });
  it("ranks by votes, then canonical order", () => {
    const m = mergeLinks([30, 0, 5, 10, 0, 5, 20, 0, 9]);
    expect(m.map((l) => l.id)).toEqual([20, 10, 30]);
  });
  it("keeps ranges from out links", () => {
    expect(mergeLinks([100, 103, 8])[0]).toMatchObject({ id: 100, end: 103 });
    expect(mergeLinks(undefined)).toEqual([]);
  });
});

describe("filters", () => {
  const gen = idFromOsis("Gen.1.1");
  const matt = idFromOsis("Matt.1.1");
  const links: XLink[] = [
    { id: gen, end: 0, votes: 50, dir: "out" },
    { id: matt, end: 0, votes: 4, dir: "in" },
    { id: matt + 1, end: 0, votes: 0, dir: "out" },
    { id: gen + 5, end: 0, votes: 19, dir: "both" },
  ];
  it("hides disputed links unless asked", () => {
    expect(filterLinks(links, DEFAULT_FILTER)).toHaveLength(3);
    expect(filterLinks(links, { ...DEFAULT_FILTER, showDisputed: true })).toHaveLength(4);
  });
  it("applies the minimum votes at the boundaries", () => {
    expect(filterLinks(links, { ...DEFAULT_FILTER, minVotes: 20 }).map((l) => l.votes)).toEqual([50]);
    expect(filterLinks(links, { ...DEFAULT_FILTER, minVotes: 19 }).map((l) => l.votes)).toEqual([50, 19]);
    expect(filterLinks(links, { ...DEFAULT_FILTER, minVotes: 5 }).map((l) => l.votes)).toEqual([50, 19]);
  });
  it("filters by testament, book and direction", () => {
    expect(filterLinks(links, { ...DEFAULT_FILTER, testament: "nt" }).every((l) => l.id >= matt)).toBe(true);
    expect(filterLinks(links, { ...DEFAULT_FILTER, books: [BOOKS.findIndex((b) => b.osis === "Gen")] })).toHaveLength(2);
    expect(filterLinks(links, { ...DEFAULT_FILTER, direction: "in" }).map((l) => l.dir)).toEqual(["in", "both"]);
    expect(filterLinks(links, { ...DEFAULT_FILTER, direction: "out" }).map((l) => l.dir)).toEqual(["out", "both"]);
  });
  it("counts by book and scales strength bars", () => {
    expect(countByBook(links).get(0)).toBe(2);
    expect(strengthFraction(50, 100)).toBe(0.5);
    expect(strengthFraction(0, 100)).toBe(0.04);
    expect(strengthFraction(500, 100)).toBe(1);
  });
});

describe("ego network", () => {
  const mk = (id: number, votes: number): XLink => ({ id, end: 0, votes, dir: "out" });
  it("takes the strongest links and skips disputed ones", () => {
    const { nodes, edges } = buildEgo(1, [mk(2, 50), mk(3, 0), mk(4, 9)], null);
    expect(nodes.map((n) => n.id)).toEqual([1, 2, 4]);
    expect(edges).toHaveLength(2);
  });
  it("never repeats a verse and stays under the cap", () => {
    const first = Array.from({ length: 20 }, (_, i) => mk(100 + i, 100 - i));
    const second = new Map(first.map((l, i) => [l.id, Array.from({ length: 10 }, (_, k) => mk(1000 + i * 10 + k, 5))]));
    const { nodes } = buildEgo(1, first, second);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
    expect(nodes.length).toBeLessThanOrEqual(MAX_EGO_NODES);
    expect(nodes.filter((n) => n.ring === 1)).toHaveLength(12);
  });
});

describe("arc data", () => {
  const edges = new Uint16Array([0, 25000, 30, 25000, 0, 8, 5, 6, 3]);
  it("filters edges by votes and direction", () => {
    const a = verseArcs(edges, { min: 5, from: "all", to: "all", books: [] });
    expect(a).toHaveLength(2);
    expect(a[0].fwd).toBe(true);
    expect(a[1].fwd).toBe(false);
    expect(verseArcs(edges, { min: 10, from: "all", to: "all", books: [] })).toHaveLength(1);
    expect(verseArcs(edges, { min: 5, from: "nt", to: "all", books: [] })).toHaveLength(1);
  });
  it("makes one arc per ordered book pair and drops self links", () => {
    const m = new Array(66 * 66).fill(0);
    m[0 * 66 + 1] = 50;
    m[1 * 66 + 0] = 10;
    m[2 * 66 + 2] = 999;
    const arcs = bookArcs(m, { from: "all", to: "all", books: [], top: 10 });
    expect(arcs).toHaveLength(2);
    expect(arcs[0].w).toBe(50);
    expect(bookArcs(m, { from: "all", to: "all", books: [], top: 1 })).toHaveLength(1);
  });
  it("totals per book and per verse", () => {
    const out = new Array(66).fill(0);
    const inn = new Array(66).fill(0);
    out[0] = 100;
    inn[0] = 50;
    const t = bookTotals(out, inn)[0];
    expect(t.total).toBe(150);
    expect(t.perVerseOut).toBeCloseTo(100 / 1533, 5);
  });
});

describe("arc geometry", () => {
  const view = { width: 1000, height: 300, domain: 1000, k: 1, tx: 0 };
  it("buckets opacity on a log scale", () => {
    expect(alphaStep(1, 1000)).toBe(0);
    expect(alphaStep(1000, 1000)).toBe(4);
    expect(alphaStep(10, 1000)).toBeLessThan(alphaStep(300, 1000));
    expect(alphaStep(5, 1)).toBe(4);
  });
  it("finds an arc near its outline and nothing far from it", () => {
    const arc: Arc = { a: 100, b: 500, w: 20, fwd: true, from: 100, to: 500 };
    // top of the arc is at x=300, height min(rx*yscale, 300) where rx=200 and yscale=min(1, 300/500)=0.6
    expect(hitArc([arc], view, 300, 120, 4)).toBe(arc);
    expect(hitArc([arc], view, 300, 20, 4)).toBeNull();
    expect(hitArc([arc], view, 900, 120, 4)).toBeNull();
  });
  it("lays segments end to end", () => {
    expect(segments([3, 2, 5])).toEqual([{ start: 0, end: 3 }, { start: 3, end: 5 }, { start: 5, end: 10 }]);
  });
});
