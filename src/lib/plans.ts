import { BOOKS } from "@/lib/canon/books";
import { getJson } from "@/lib/data/load";
import { toId, verseCount } from "@/lib/canon/canon";
import { DAY, type PlanProgress, type PlanState } from "@/lib/store/types";

/** [book index, first chapter, last chapter, first verse?, last verse?] */
export type PlanRange = [number, number, number] | [number, number, number, number, number];
export interface PlanData {
  id: string;
  name: string;
  description: string;
  days: PlanRange[][];
}
export interface PlanSummary {
  id: string;
  name: string;
  description: string;
  days: number;
}

export const loadPlanIndex = () => getJson<PlanSummary[]>("plans/index.json");
export const loadPlan = (id: string) => getJson<PlanData>(`plans/${id}.json`);

const parseIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
export const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Day number of the plan for a date: 1 on the start date. Zero or less means it has not started yet. */
export function dayNumber(startIso: string, todayIso: string): number {
  return Math.round((parseIso(todayIso) - parseIso(startIso)) / DAY) + 1;
}

export function dateOfDay(startIso: string, day: number): string {
  const d = new Date(parseIso(startIso) + (day - 1) * DAY);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Days in a row that are done, counting back from today (or from yesterday if today is not done yet). */
export function streak(done: Set<number>, today: number): number {
  let day = done.has(today) ? today : today - 1;
  let n = 0;
  while (day >= 1 && done.has(day)) {
    n++;
    day--;
  }
  return n;
}

export function progressSet(rows: PlanProgress[]): Set<number> {
  return new Set(rows.map((r) => r.day));
}

export function formatPlanRange(r: PlanRange): string {
  const [b, c1, c2, v1, v2] = r;
  const name = BOOKS[b].name;
  if (v1 !== undefined) return `${name} ${c1}:${v1}-${v2}`;
  if (BOOKS[b].osis === "Obad" || BOOKS[b].osis === "Phlm" || BOOKS[b].osis === "2John" || BOOKS[b].osis === "3John" || BOOKS[b].osis === "Jude") return name;
  return c1 === c2 ? `${name} ${c1}` : `${name} ${c1}-${c2}`;
}

/** Link target for a plan range: the first chapter, with the verses selected when a range is given. */
export function planRangePath(r: PlanRange): string {
  const [b, c1, , v1, v2] = r;
  const q = v1 !== undefined ? `?v=${v1}-${v2}` : "";
  return `/read/${BOOKS[b].slug}/${c1}${q}`;
}

export function rangeVerseCount(r: PlanRange): number {
  const [b, c1, c2, v1, v2] = r;
  if (v1 !== undefined && v2 !== undefined) return v2 - v1 + 1;
  let n = 0;
  for (let c = c1; c <= c2; c++) n += verseCount(b, c);
  return n;
}

export const todayLocal = () => isoOf(new Date());
export { toId };
export type { PlanState };

/** Move an ISO date by a number of days (negative goes back). */
export function shiftIso(iso: string, days: number): string {
  const d = new Date(parseIso(iso) + days * DAY);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** The first day that is not done yet, or total + 1 if everything is done. */
export function firstUndone(done: Set<number>, total: number): number {
  for (let d = 1; d <= total; d++) if (!done.has(d)) return d;
  return total + 1;
}

/**
 * "Catch up" moves the start date so that today is the first day not yet done.
 * Missed days are not shown as failures; the plan just carries on from where the person is.
 */
export function catchUpStart(todayIso: string, done: Set<number>, total: number): string {
  const first = Math.min(firstUndone(done, total), total);
  return shiftIso(todayIso, -(first - 1));
}
