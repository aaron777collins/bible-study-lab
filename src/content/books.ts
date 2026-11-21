import { BOOKS } from "@/lib/canon/books";
import type { BookOverview } from "./types";
import { NT_OVERVIEWS } from "./books-nt";
import { OT_OVERVIEWS } from "./books-ot";

export type { BookOverview } from "./types";

const ALL: Record<string, BookOverview> = { ...OT_OVERVIEWS, ...NT_OVERVIEWS };

export function overviewFor(osis: string): BookOverview | undefined {
  return ALL[osis];
}

export const OVERVIEW_OSIS = BOOKS.map((b) => b.osis);
