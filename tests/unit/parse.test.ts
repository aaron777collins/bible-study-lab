import { describe, expect, it } from "vitest";
import { BOOKS } from "@/lib/canon/books";
import { chapterCount, fromId, idFromOsis, osisFromId, toId, TOTAL_VERSES, verseCount, bookOfId } from "@/lib/canon/canon";
import { formatPassage, formatRange, parseRef, passageIds } from "@/lib/canon/parse";

const ok = (s: string) => {
  const r = parseRef(s);
  if (!r.ok) throw new Error(`${s}: ${r.error}`);
  return r.passages;
};
const label = (s: string) => ok(s).map((p) => formatPassage(p)).join(" | ");

describe("canon", () => {
  it("has 31,102 verses and 1,189 chapters", () => {
    expect(TOTAL_VERSES).toBe(31102);
    expect(BOOKS.reduce((a, _, i) => a + chapterCount(i), 0)).toBe(1189);
  });
  it("round trips every verse id", () => {
    for (let id = 0; id < TOTAL_VERSES; id += 7) {
      const r = fromId(id);
      expect(toId(r.book, r.chapter, r.verse)).toBe(id);
      expect(bookOfId(id)).toBe(r.book);
      expect(idFromOsis(osisFromId(id))).toBe(id);
    }
    expect(fromId(0)).toEqual({ book: 0, chapter: 1, verse: 1 });
    expect(fromId(TOTAL_VERSES - 1)).toEqual({ book: 65, chapter: 22, verse: 21 });
  });
  it("knows John 3:16", () => {
    const john = BOOKS.findIndex((b) => b.osis === "John");
    expect(osisFromId(toId(john, 3, 16))).toBe("John.3.16");
    expect(verseCount(john, 3)).toBe(36);
  });
  it("clamps a verse one past the end only when asked", () => {
    expect(idFromOsis("3John.1.15")).toBe(-1);
    expect(idFromOsis("3John.1.15", true)).toBe(idFromOsis("3John.1.14"));
  });
});

describe("reference parser", () => {
  it.each([
    ["Jn 3:16", "John 3:16"],
    ["john 3.16", "John 3:16"],
    ["John 3:16-18", "John 3:16-18"],
    ["Jn 3:16-4:2", "John 3:16-4:2"],
    ["1 Cor 13", "1 Corinthians 13"],
    ["1co13:4", "1 Corinthians 13:4"],
    ["I John 1:9", "1 John 1:9"],
    ["First John 1:9", "1 John 1:9"],
    ["II Kings 2:11", "2 Kings 2:11"],
    ["2nd Kings 2:11", "2 Kings 2:11"],
    ["III John 4", "3 John 4"],
    ["Ps 23", "Psalms 23"],
    ["Psalm 23:1-3", "Psalms 23:1-3"],
    ["Song of Solomon 2:4", "Song of Solomon 2:4"],
    ["Song of Songs 2:4", "Song of Solomon 2:4"],
    ["SoS 2:4", "Song of Solomon 2:4"],
    ["John.3.16", "John 3:16"],
    ["Jude 5", "Jude 5"],
    ["Phil 4:13; Rom 8:28", "Philippians 4:13 | Romans 8:28"],
    ["Rom 8:28; 12:2", "Romans 8:28 | Romans 12:2"],
    ["Ps 23:1-3, 5", "Psalms 23:1-3 | Psalms 23:5"],
    ["GEN 1:1", "Genesis 1:1"],
    ["  john   3 : 16  ", "John 3:16"],
    ["Matthew 5-7", "Matthew 5-7"],
  ])("reads %s", (input, expected) => {
    expect(label(input)).toBe(expected);
  });

  it("a book alone means the whole book", () => {
    const [p] = ok("Genesis");
    expect([p.c1, p.c2, p.whole]).toEqual([1, 50, true]);
  });

  it("asks when a name is ambiguous", () => {
    const r = parseRef("Jud");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("Judges");
      expect(r.error).toContain("Jude");
      expect(r.candidates?.length).toBe(2);
    }
  });

  it.each([
    ["John 22", "John has 21 chapters."],
    ["John 3:99", "John 3 has 36 verses."],
    ["Obadiah 22", "Obadiah 1 has 21 verses."],
    ["Obadiah 1:5-2:1", "Obadiah has 1 chapter."],
    ["xyz 1:1", 'I do not know a book called "xyz".'],
    ["", "Type a reference such as John 3:16."],
    ["John 3:5-2", "That range runs backwards."],
  ])("explains %j", (input, message) => {
    const r = parseRef(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(message);
  });

  it("round trips every book and chapter through format and parse", () => {
    BOOKS.forEach((b, i) => {
      for (const c of [1, chapterCount(i)]) {
        const v = verseCount(i, c);
        const text = chapterCount(i) === 1 ? `${b.name} ${v}` : `${b.name} ${c}:${v}`;
        const [p] = ok(text);
        expect(p.book).toBe(i);
        expect(p.c1).toBe(c);
        expect(p.v1).toBe(v);
        expect(formatPassage(p)).toBe(text);
        // abbreviations and osis ids resolve to the same book
        expect(ok(`${b.osis} ${c}:${v}`)[0].book).toBe(i);
      }
    });
  });

  it("gives ids for a passage and formats ranges that cross books", () => {
    const [p] = ok("John 3:16-18");
    const [a, b] = passageIds(p);
    expect(b - a).toBe(2);
    expect(formatRange(a, b)).toBe("John 3:16-18");
    const hag = idFromOsis("Hag.2.20");
    const zech = idFromOsis("Zech.1.1");
    expect(formatRange(hag, zech)).toBe("Haggai 2:20 to Zechariah 1:1");
  });
});
