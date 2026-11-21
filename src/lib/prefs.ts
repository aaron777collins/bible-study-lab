import { create } from "zustand";
import { DEFAULT_TRANSLATION, isTranslationId } from "./translations";

export type ThemeChoice = "system" | "light" | "dark";
export interface LastRead {
  book: number;
  chapter: number;
}
interface Prefs {
  theme: ThemeChoice;
  /** 0 to 4: smaller to larger scripture text */
  textSize: number;
  /** 0 compact, 1 normal, 2 roomy */
  spacing: number;
  translation: string;
  redLetter: boolean;
  verseLayout: "paragraphs" | "verses";
  font: "serif" | "sans";
  last: LastRead | null;
}
const KEY = "bsl-prefs-v1";
const DEFAULTS: Prefs = { theme: "system", textSize: 2, spacing: 1, translation: DEFAULT_TRANSLATION, redLetter: true, verseLayout: "paragraphs", font: "serif", last: null };

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: p.theme === "light" || p.theme === "dark" ? p.theme : "system",
      textSize: Number.isInteger(p.textSize) && p.textSize! >= 0 && p.textSize! <= 4 ? p.textSize! : DEFAULTS.textSize,
      spacing: p.spacing === 0 || p.spacing === 2 ? p.spacing : 1,
      translation: typeof p.translation === "string" && isTranslationId(p.translation) ? p.translation : DEFAULT_TRANSLATION,
      redLetter: p.redLetter !== false,
      verseLayout: p.verseLayout === "verses" ? "verses" : "paragraphs",
      font: p.font === "sans" ? "sans" : "serif",
      last: p.last && Number.isInteger(p.last.book) && Number.isInteger(p.last.chapter) ? p.last : null,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private window or storage blocked: preferences last for this visit only */
  }
}

const SIZES = ["1.0625rem", "1.125rem", "1.1875rem", "1.3125rem", "1.5rem"];
const LEADING = ["1.55", "1.7", "1.9"];

export function systemDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}
export const resolveTheme = (t: ThemeChoice): "light" | "dark" => (t === "system" ? (systemDark() ? "dark" : "light") : t);

export function applyPrefs(p: Prefs) {
  const el = document.documentElement;
  el.dataset.theme = resolveTheme(p.theme);
  el.dataset.redletter = p.redLetter ? "on" : "off";
  el.dataset.font = p.font;
  el.style.setProperty("--scripture-size", SIZES[p.textSize]);
  el.style.setProperty("--scripture-leading", LEADING[p.spacing]);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolveTheme(p.theme) === "dark" ? "#0f141e" : "#f5f7fa");
}

interface PrefsStore extends Prefs {
  set: (patch: Partial<Prefs>) => void;
}
export const usePrefs = create<PrefsStore>((set, get) => ({
  ...load(),
  set: (patch) => {
    set(patch);
    const { set: _s, ...rest } = get();
    void _s;
    save(rest);
    applyPrefs(rest);
  },
}));

export function initPrefs() {
  const { set: _s, ...rest } = usePrefs.getState();
  void _s;
  applyPrefs(rest);
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      const s = usePrefs.getState();
      if (s.theme === "system") applyPrefs(s);
    });
  } catch {
    /* ignore */
  }
}
