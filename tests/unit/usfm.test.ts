import { describe, expect, it } from "vitest";
import { ADD_CLOSE, ADD_OPEN, NOTE_ANCHOR, WJ_CLOSE, WJ_OPEN, normalizePieces, normalizeStrong, parseUsfm, piecesToText } from "../../scripts/usfm";

const text = (src: string, c: number, v: number) => piecesToText(normalizePieces(parseUsfm(src).chapters.get(c)!.verses.get(v)!.pieces));

describe("USFM reader", () => {
  it("reads chapters, verses and paragraph starts", () => {
    const b = parseUsfm("\\id GEN\n\\c 1\n\\p\n\\v 1 In the beginning.\n\\v 2 The earth was empty.\n\\p\n\\v 3 Light.\n\\c 2\n\\p\n\\v 1 Done.");
    expect([...b.chapters.keys()]).toEqual([1, 2]);
    expect(text("\\c 1\n\\p\n\\v 1 In the beginning.\n\\v 2 The earth.", 1, 2)).toBe("The earth.");
    expect(b.chapters.get(1)!.verses.get(1)!.paraStart).toBe(true);
    expect(b.chapters.get(1)!.verses.get(2)!.paraStart).toBe(false);
    expect(b.chapters.get(1)!.verses.get(3)!.paraStart).toBe(true);
  });

  it("keeps Strong's tags and the plain text", () => {
    const b = parseUsfm('\\c 3\n\\p\n\\v 16 For \\w God|strong="G2316"\\w* \\w so|strong="G3779"\\w* \\w loved|strong="G0025"\\w* the world.');
    const pieces = normalizePieces(b.chapters.get(3)!.verses.get(16)!.pieces);
    expect(piecesToText(pieces)).toBe("For God so loved the world.");
    expect(pieces.filter((p) => Array.isArray(p))).toEqual([["God", "G2316"], ["so", "G3779"], ["loved", "G25"]]);
  });

  it("normalizes Strong's numbers", () => {
    expect(normalizeStrong("G0025")).toBe("G25");
    expect(normalizeStrong("H0430")).toBe("H430");
    expect(normalizeStrong("H8674")).toBe("H8674");
  });

  it("wraps the words of Jesus and nested tagged words", () => {
    const t = text('\\c 4\n\\p\n\\v 10 Jesus said, \\wj  \\+w Give|strong="G1325"\\+w* me \\+w drink|strong="G4095"\\+w*.\\wj* Then.', 4, 10);
    expect(t).toBe(`Jesus said, ${WJ_OPEN}Give me drink.${WJ_CLOSE} Then.`);
  });

  it("marks added words and removes the pilcrow", () => {
    const t = text("\\c 1\n\\p\n\\v 6 ¶ There was a man \\add whose\\add* name.", 1, 6);
    expect(t).toBe(`There was a man ${ADD_OPEN}whose${ADD_CLOSE} name.`);
  });

  it("collects footnotes and leaves an anchor", () => {
    const b = parseUsfm("\\c 1\n\\p\n\\v 4 And God saw.\\f + \\fr 1.4 \\ft the light: Heb. between\\f* Next.");
    const v = b.chapters.get(1)!.verses.get(4)!;
    expect(v.notes).toEqual(["the light: Heb. between"]);
    expect(piecesToText(normalizePieces(v.pieces))).toBe(`And God saw.${NOTE_ANCHOR} Next.`);
  });

  it("drops cross reference lists and headings", () => {
    const t = text("\\c 1\n\\s1 A heading\n\\p\n\\v 1 In the beginning\\x - \\xo 1:1 \\xt Job 38:4\\x* God.", 1, 1);
    expect(t).toBe("In the beginning God.");
  });

  it("reads poetry lines as one verse, and psalm titles", () => {
    const b = parseUsfm("\\c 3\n\\d A Psalm of David.\n\\q1\n\\v 1 LORD, how many\n\\q2 are my foes!\n\\q1\n\\v 2 Many say.");
    const ch = b.chapters.get(3)!;
    expect(ch.title).toBe("A Psalm of David.");
    expect(piecesToText(normalizePieces(ch.verses.get(1)!.pieces))).toBe("LORD, how many are my foes!");
    expect(ch.verses.get(1)!.poetry).toBe(true);
  });

  it("keeps a verse that holds only a note, like Romans 16:25 in the WEB", () => {
    const b = parseUsfm("\\c 16\n\\p\n\\v 24 Grace.\n\\v 25 \\f + \\fr 16:25 \\ft TR places Romans 14:24-26 here.\\f*\n\\c 17\n\\p\n\\v 1 Next.");
    const v = b.chapters.get(16)!.verses.get(25)!;
    expect(piecesToText(normalizePieces(v.pieces))).toBe(NOTE_ANCHOR);
    expect(v.notes[0]).toContain("TR places");
  });

  it("reports bridged verses", () => {
    expect(parseUsfm("\\c 1\n\\p\n\\v 1-2 Both.").warnings.join()).toContain("bridged");
  });
});
