export type NoteKind = "note" | "prayer" | "study";
export const HIGHLIGHT_COLORS = ["gold", "sky", "olive", "rose", "lavender", "stone"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];
export const HIGHLIGHT_LABEL: Record<HighlightColor, string> = { gold: "Gold", sky: "Sky", olive: "Olive", rose: "Rose", lavender: "Lavender", stone: "Stone" };

export interface Prompts {
  observe: string;
  interpret: string;
  apply: string;
}
export interface Note {
  id: string;
  start: number;
  end: number;
  body: string;
  tags: string[];
  kind: NoteKind;
  answeredAt?: number;
  prompts?: Prompts;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
export interface Highlight {
  verseId: number;
  color: HighlightColor;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
export interface Bookmark {
  id: string;
  start: number;
  end: number;
  label: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
export interface Collection {
  id: string;
  title: string;
  refs: [number, number][];
  description: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
export interface PlanState {
  planId: string;
  /** yyyy-mm-dd, local date */
  startDate: string;
  active: boolean;
  /** days the start date has been moved forward by "Catch up" */
  catchUp: number;
}
export interface PlanProgress {
  planId: string;
  day: number;
  doneAt: number;
}
export interface MemoryItem {
  id: string;
  start: number;
  end: number;
  /** Leitner box 1 to 5 */
  box: number;
  dueAt: number;
  lastReviewedAt?: number;
  reviews: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface BackupData {
  notes: Note[];
  highlights: Highlight[];
  bookmarks: Bookmark[];
  collections: Collection[];
  plans: PlanState[];
  planProgress: PlanProgress[];
  memory: MemoryItem[];
}
export interface BackupFile {
  app: "bible-study-lab";
  schema: 1;
  exportedAt: string;
  counts: Record<keyof BackupData, number>;
  data: BackupData;
}

export const DAY = 86_400_000;
export const SOFT_DELETE_DAYS = 30;
