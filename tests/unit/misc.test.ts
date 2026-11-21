import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { distinctiveWords, tokenize, topWords } from "../../scripts/insights-math";
import { formatCopy } from "@/lib/share/format";
import { fitText, wrapLines } from "@/lib/share/card";
import { extendSelection, formatVerseParam, paragraphs, parseVerseParam, chapterNeighbors } from "@/lib/reader";
import { catchUpStart, dateOfDay, dayNumber, firstUndone, formatPlanRange, shiftIso, streak } from "@/lib/plans";
import { highlightPieces, normalize, parseQuery } from "@/lib/search/query";
import { STARTER_TOPICS } from "@/lib/topics";
import { dayOfYearForTest } from "./helpers";

describe("word statistics", () => {
  const counts = (s: string) => {
    const m = new Map<string, number>();
    for (const t of tokenize(s)) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  };
  // three tiny books
  const a = counts("grace grace grace and the love of the lord lord");
  const b = counts("wisdom wisdom the lord and the lord lord");
  const c = counts("the the lord love and love");
  const total = (m: Map<string, number>) => [...m.values()].reduce((x, y) => x + y, 0);
  const df = new Map<string, number>();
  for (const m of [a, b, c]) for (const w of m.keys()) df.set(w, (df.get(w) ?? 0) + 1);

  it("tokenizes and counts, dropping markers", () => {
    expect(tokenize("The Lord’s word, and God.")).toEqual(["the", "lord's", "word", "and", "god"]);
  });
  it("lists top words without small ones", () => {
    expect(topWords(a, 3)).toEqual([["grace", 3], ["lord", 2], ["love", 1]]);
  });
  it("ranks words that one book uses and the others do not", () => {
    const d = distinctiveWords(a, total(a), df, 3, 1);
    expect(d[0][0]).toBe("grace");
    expect(d.find((x) => x[0] === "lord")?.[2]).toBe(0); // in every book, so it says nothing about this one
    expect(d[0][2]).toBeCloseTo(Math.round((3 / total(a)) * Math.log(3) * 1e6) / 100, 5);
    expect(distinctiveWords(b, total(b), df, 3, 1)[0][0]).toBe("wisdom");
    expect(distinctiveWords(a, total(a), df, 3, 3).map((x) => x[0])).toEqual(["grace", "lord"].filter((w) => w === "grace"));
  });
});

describe("copy formats", () => {
  const input = { start: 24280, end: 24281, tr: "kjv", verses: [[24280, "For God so loved the world."], [24281, "For God sent not his Son."]] as [number, string][] };
  it("formats plain, numbered and markdown", () => {
    const john316 = 23145 + 0; // any ids in the NT
    void john316;
    expect(formatCopy({ ...input }, "plain")).toMatch(/^“For God so loved the world\. For God sent not his Son\.” .+ KJV$/);
    expect(formatCopy(input, "numbered")).toMatch(/\(KJV\)\n\d+ For God so loved/);
    expect(formatCopy(input, "markdown")).toMatch(/^> For God so loved the world\. For God sent not his Son\.\n>\n> \*\*.+\*\* \(KJV\)$/);
  });
  it("copies a single verse with its reference", () => {
    expect(formatCopy({ start: 0, end: 0, tr: "web", verses: [[0, "In the beginning, God created the heavens and the earth."]] }, "plain")).toBe("“In the beginning, God created the heavens and the earth.” Genesis 1:1 WEB");
  });
});

describe("verse card text fitting", () => {
  const measure = (s: string, size: number) => s.length * size * 0.5;
  it("wraps lines to the width", () => {
    const lines = wrapLines((s) => s.length * 10, "one two three four five six", 100);
    expect(lines.every((l) => l.length * 10 <= 100)).toBe(true);
    expect(lines.join(" ")).toBe("one two three four five six");
  });
  it("picks the largest size that fits", () => {
    const short = fitText(measure, "In the beginning", 900, 500, { minSize: 20, maxSize: 80 });
    const long = fitText(measure, "word ".repeat(80).trim(), 900, 500, { minSize: 20, maxSize: 80 });
    expect(short.size).toBe(80);
    expect(long.size).toBeLessThan(short.size);
    expect(long.lines.length * long.size * 1.32).toBeLessThanOrEqual(500);
  });
  it("shortens text that cannot fit even at the smallest size", () => {
    const r = fitText(measure, "word ".repeat(2000), 400, 200, { minSize: 20, maxSize: 40 });
    expect(r.size).toBe(20);
    expect(r.lines[r.lines.length - 1].endsWith("…")).toBe(true);
    expect(r.lines.length * 20 * 1.32).toBeLessThanOrEqual(200);
  });
});

describe("URL state for the reader", () => {
  it("parses and formats verse selections", () => {
    expect(parseVerseParam("16", 36)).toEqual([16, 16]);
    expect(parseVerseParam("16-18", 36)).toEqual([16, 18]);
    expect(parseVerseParam("18-16", 36)).toBeNull();
    expect(parseVerseParam("0", 36)).toBeNull();
    expect(parseVerseParam("40", 36)).toBeNull();
    expect(parseVerseParam("abc", 36)).toBeNull();
    expect(parseVerseParam(null, 36)).toBeNull();
    expect(formatVerseParam([16, 16])).toBe("16");
    expect(formatVerseParam([16, 18])).toBe("16-18");
    expect(formatVerseParam(null)).toBeNull();
  });
  it("extends and groups", () => {
    expect(extendSelection(null, 5)).toEqual([5, 5]);
    expect(extendSelection([5, 6], 9)).toEqual([5, 9]);
    expect(extendSelection([5, 9], 2)).toEqual([2, 9]);
    expect(extendSelection([5, 9], 7)).toEqual([7, 7]);
    expect(paragraphs(5, [3], false)).toEqual([[1, 2], [3, 4, 5]]);
    expect(paragraphs(3, [], true)).toEqual([[1], [2], [3]]);
  });
  it("finds the neighbouring chapters across books", () => {
    expect(chapterNeighbors(0, 1).prev).toBeNull();
    expect(chapterNeighbors(0, 50).next).toEqual({ book: 1, chapter: 1 });
    expect(chapterNeighbors(65, 22).next).toBeNull();
  });
});

describe("plans", () => {
  it("counts days and dates", () => {
    expect(dayNumber("2026-01-01", "2026-01-01")).toBe(1);
    expect(dayNumber("2026-01-01", "2026-01-10")).toBe(10);
    expect(dayNumber("2026-01-05", "2026-01-01")).toBe(-3);
    expect(dateOfDay("2026-01-01", 32)).toBe("2026-02-01");
    expect(shiftIso("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("counts the streak back from today, or from yesterday if today is not done", () => {
    expect(streak(new Set([1, 2, 3]), 3)).toBe(3);
    expect(streak(new Set([1, 2, 3]), 4)).toBe(3);
    expect(streak(new Set([1, 2, 3]), 5)).toBe(0);
    expect(streak(new Set([1, 3, 4]), 4)).toBe(2);
    expect(streak(new Set(), 1)).toBe(0);
  });
  it("catches up by moving the start, not by marking days missed", () => {
    expect(firstUndone(new Set([1, 2, 4]), 10)).toBe(3);
    expect(firstUndone(new Set([1, 2]), 2)).toBe(3);
    // today is 2026-01-20; days 1 and 2 are done, so the plan should restart so that today is day 3
    const start = catchUpStart("2026-01-20", new Set([1, 2]), 30);
    expect(dayNumber(start, "2026-01-20")).toBe(3);
  });
  it("formats ranges", () => {
    expect(formatPlanRange([42, 3, 3])).toBe("John 3");
    expect(formatPlanRange([0, 1, 3])).toBe("Genesis 1-3");
    expect(formatPlanRange([41, 1, 1, 1, 38])).toBe("Luke 1:1-38");
    expect(formatPlanRange([64, 1, 1])).toBe("Jude");
  });
});

describe("the generated plans", () => {
  const dir = path.resolve(import.meta.dirname, "../../public/data/v1/plans");
  const plan = (id: string) => JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), "utf8")) as { days: number[][][] };
  const chapterCounts = (id: string) => {
    const m = new Map<string, number>();
    for (const day of plan(id).days) for (const [b, c1, c2, v1] of day) if (v1 === undefined) for (let c = c1; c <= c2; c++) m.set(`${b}:${c}`, (m.get(`${b}:${c}`) ?? 0) + 1);
    return m;
  };
  it("reads the whole Bible once in a year", () => {
    const p = plan("bible-in-a-year");
    expect(p.days).toHaveLength(365);
    const m = chapterCounts("bible-in-a-year");
    expect(m.size).toBe(1189);
    expect([...m.values()].every((n) => n === 1)).toBe(true);
    const verses = p.days.map((d) => d.reduce((a, [, c1, c2]) => a + (c2 - c1 + 1), 0));
    expect(Math.min(...verses)).toBeGreaterThanOrEqual(1);
  });
  it("is M'Cheyne: 365 days, 4 readings, the New Testament and Psalms twice, the rest once", () => {
    const p = plan("mcheyne");
    expect(p.days).toHaveLength(365);
    expect(p.days.every((d) => d.length === 4)).toBe(true);
    const m = chapterCounts("mcheyne");
    expect(m.get("42:3")).toBe(2); // John 3
    expect(m.get("0:1")).toBe(1); // Genesis 1
    expect(m.get("18:23")).toBe(2); // Psalm 23
  });
  it("covers each short plan", () => {
    expect(plan("new-testament-90").days).toHaveLength(90);
    expect(chapterCounts("new-testament-90").size).toBe(260);
    expect(plan("gospels-40").days).toHaveLength(40);
    expect(chapterCounts("gospels-40").size).toBe(89);
    expect(plan("john-21").days).toHaveLength(21);
    expect(plan("psalms-proverbs-31").days).toHaveLength(31);
    expect(chapterCounts("psalms-proverbs-31").size).toBe(150 + 31);
  });
});

describe("search query", () => {
  it("normalizes text for matching", () => {
    expect(normalize("The LORD’s “word”, and  God!")).toBe("the lord's word and god");
  });
  it("finds a reference, a Strong's number, words and phrases", () => {
    expect(parseQuery("Jn 3:16").reference?.v1).toBe(16);
    expect(parseQuery("John").reference).toBeNull();
    expect(parseQuery("g26").strongs).toBe("G26");
    expect(parseQuery("H430").strongs).toBe("H430");
    expect(parseQuery('"living water" spring')).toMatchObject({ phrases: ["living water"], words: ["spring"] });
    expect(parseQuery("love one another").words).toEqual(["love", "one", "another"]);
  });
  it("highlights whole word starts and phrases", () => {
    const hit = (t: string, terms: string[]) => highlightPieces(t, terms).filter((p) => p.hit).map((p) => p.t);
    expect(hit("The waters and the water", ["water"])).toEqual(["waters", "water"]);
    expect(hit("A watershed", ["shed"])).toEqual([]);
    expect(hit("a well of living water, springing", ["living water"])).toEqual(["living water"]);
    expect(hit("nothing here", ["x"])).toEqual([]);
  });
});

describe("topics", () => {
  it("only lists starter topics that exist", () => {
    const idx = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../public/data/v1/topics/index.json"), "utf8")) as [string, string, number][];
    const slugs = new Set(idx.map((r) => r[1]));
    expect(STARTER_TOPICS).toHaveLength(40);
    for (const s of STARTER_TOPICS) expect(slugs.has(s), s).toBe(true);
  });
});

describe("verse of the day", () => {
  it("has a verse for every day including 29 February", () => {
    const votd = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../public/data/v1/votd.json"), "utf8")) as number[];
    expect(votd).toHaveLength(366);
    expect(new Set(votd).size).toBe(366);
    expect(dayOfYearForTest(new Date(2027, 0, 1))).toBe(0);
    expect(dayOfYearForTest(new Date(2028, 1, 29))).toBe(59); // 29 February has its own verse
    expect(dayOfYearForTest(new Date(2027, 2, 1))).toBe(60); // 1 March is the same day number in every year
    expect(dayOfYearForTest(new Date(2027, 11, 31))).toBe(365);
  });
});
