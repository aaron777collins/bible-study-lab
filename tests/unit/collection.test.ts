// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildShareLink, decodeCollection, encodeCollection, SHARE_LIMIT } from "@/lib/share/collection";

describe("shared collections", () => {
  const c = { title: "Week 3: grace", description: "Read these before we meet.", refs: [[24280, 24282], [100, 100], [5, 9]] as [number, number][] };

  it("round trips through the link payload", async () => {
    const payload = await encodeCollection(c);
    expect(payload).toMatch(/^z[A-Za-z0-9_-]+$/);
    expect(await decodeCollection(payload)).toEqual({ ...c });
  });

  it("is compact enough for a link", async () => {
    const link = await buildShareLink(c);
    expect(link.ok).toBe(true);
    if (link.ok) {
      expect(link.path.startsWith("/c/")).toBe(true);
      expect(link.length).toBeLessThan(200);
    }
  });

  it("refuses payloads over the 2,000 character cap", async () => {
    const refs: [number, number][] = Array.from({ length: 400 }, (_, i) => [i * 37 + 11, i * 37 + 15]);
    const link = await buildShareLink({ title: "Too many", refs });
    expect(link.ok).toBe(false);
    expect(link.length).toBeGreaterThan(SHARE_LIMIT);
  });

  it.each(["", "zzzz", "u!!!", "x123", "z" + "A".repeat(10)])("rejects a damaged payload %j", async (p) => {
    expect(await decodeCollection(p)).toBeNull();
  });

  it("rejects a payload with verses outside the Bible", async () => {
    const raw = "u" + Buffer.from(JSON.stringify(["t", "", [[99999]]])).toString("base64url");
    expect(await decodeCollection(raw)).toBeNull();
    const backwards = "u" + Buffer.from(JSON.stringify(["t", "", [[50, 40]]])).toString("base64url");
    expect(await decodeCollection(backwards)).toBeNull();
  });
});
