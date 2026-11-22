import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { BOOKS } from "@/lib/canon/books";
import { NOTES_BOOKS } from "@/lib/data/notes.generated";
import { hasBookNotes, loadBookNotes } from "@/lib/data/text";

const TEXT = path.join(process.cwd(), "public", "data", "v1", "text");
const idx = (osis: string) => BOOKS.findIndex((b) => b.osis === osis);

describe("footnotes index", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("matches the files on disk", () => {
    expect(Object.keys(NOTES_BOOKS).sort()).toEqual(fs.readdirSync(TEXT).sort());
    for (const [tr, list] of Object.entries(NOTES_BOOKS)) {
      const onDisk = BOOKS.filter((b) => fs.existsSync(path.join(TEXT, tr, `${b.osis}.notes.json`))).map((b) => b.osis);
      expect([...list]).toEqual(onDisk);
    }
  });

  it("says which books have notes", () => {
    expect(hasBookNotes("kjv", idx("Gen"))).toBe(true);
    expect(hasBookNotes("kjv", idx("John"))).toBe(false);
    expect(hasBookNotes("asv", idx("John"))).toBe(true);
    expect(hasBookNotes("ylt", idx("Gen"))).toBe(false);
    expect(hasBookNotes("nope", idx("Gen"))).toBe(false);
  });

  it("makes no request for a book without notes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await loadBookNotes("kjv", idx("John"))).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
