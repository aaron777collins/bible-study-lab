import { DAY } from "./types";
import type { MemoryItem } from "./types";

/** Days until the next review for each Leitner box. */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;

/** Move a memory item after a review: right goes up a box, wrong goes back to box 1. */
export function review(item: MemoryItem, correct: boolean, now = Date.now()): MemoryItem {
  const box = correct ? Math.min(5, item.box + 1) : 1;
  return { ...item, box, dueAt: now + BOX_INTERVAL_DAYS[box] * DAY, lastReviewedAt: now, reviews: item.reviews + 1, updatedAt: now };
}

export const isDue = (item: MemoryItem, now = Date.now()) => item.dueAt <= now;

/**
 * What to show while reviewing. The higher the box, the less of the verse is shown:
 * 1 first letter and a blank for each other letter, 2 first letters only, 3 first letters of every other word,
 * 4 the first word and the first letter of every fourth word, 5 the first word only.
 */
export function cue(text: string, box: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  const parts = words.map((w) => {
    const m = /^([^\p{L}\p{N}]*)([\p{L}\p{N}'\u2019-]*)(.*)$/u.exec(w) ?? [w, "", w, ""];
    return { lead: m[1], core: m[2], trail: m[3] };
  });
  const letter = (core: string) => core.slice(0, 1);
  return parts
    .map(({ lead, core, trail }, i) => {
      if (!core) return lead + trail;
      if (box <= 1) return `${lead}${letter(core)}${"_".repeat(Math.min(core.length - 1, 5))}${trail}`;
      if (box === 2) return `${lead}${letter(core)}${trail}`;
      if (box === 3) return i % 2 === 0 ? `${lead}${letter(core)}${trail}` : `_${trail.replace(/[\p{L}\p{N}]/gu, "")}`;
      if (box === 4) return i === 0 ? `${lead}${core}${trail}` : i % 4 === 0 ? `${lead}${letter(core)}${trail}` : "_";
      return i === 0 ? `${lead}${core}${trail}` : "";
    })
    .filter((x, i) => x !== "" || i === 0)
    .join(" ")
    .trim()
    .concat(box >= 5 ? " ..." : "");
}
