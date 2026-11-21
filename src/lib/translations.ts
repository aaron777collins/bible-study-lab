export interface Translation {
  id: string;
  name: string;
  short: string;
  /** one line for the picker */
  blurb: string;
  redLetter: boolean;
  approxKb: number;
}

export const TRANSLATIONS: readonly Translation[] = [
  { id: "kjv", name: "King James Version", short: "KJV", blurb: "The classic 1769 text, with Strong's numbers", redLetter: true, approxKb: 1250 },
  { id: "web", name: "World English Bible", short: "WEB", blurb: "A modern, plain English update of the ASV", redLetter: true, approxKb: 1250 },
  { id: "asv", name: "American Standard Version", short: "ASV", blurb: "A careful 1901 word-for-word translation", redLetter: false, approxKb: 1250 },
  { id: "ylt", name: "Young's Literal Translation", short: "YLT", blurb: "Very literal, useful for seeing the structure", redLetter: false, approxKb: 1250 },
];

export const DEFAULT_TRANSLATION = "kjv";

export function translationById(id: string | null | undefined): Translation {
  return TRANSLATIONS.find((t) => t.id === id) ?? TRANSLATIONS[0];
}
export const isTranslationId = (id: string): boolean => TRANSLATIONS.some((t) => t.id === id);
