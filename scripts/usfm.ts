/**
 * A small USFM reader for the eBible packages we use.
 * It understands: \c \v \p \m \q \b \d \wj \add \nd \w|strong \f \x and ignores the rest.
 */

export const WJ_OPEN = "";
export const WJ_CLOSE = "";
export const ADD_OPEN = "";
export const ADD_CLOSE = "";
export const ND_OPEN = "";
export const ND_CLOSE = "";
export const NOTE_ANCHOR = "";

export type Piece = string | [word: string, strong: string];

export interface ParsedVerse {
  n: number;
  pieces: Piece[];
  notes: string[];
  paraStart: boolean;
  poetry: boolean;
}
export interface ParsedChapter {
  n: number;
  title: string;
  verses: Map<number, ParsedVerse>;
}
export interface ParsedBook {
  chapters: Map<number, ParsedChapter>;
  warnings: string[];
}

const HEADING_MARKERS = new Set([
  "id", "ide", "h", "toc1", "toc2", "toc3", "mt", "mt1", "mt2", "mt3", "mt4", "s", "s1", "s2", "s3", "r", "ms", "ms1", "ms2",
  "sp", "ip", "ib", "is", "imt", "imt1", "imt2", "cl", "cd", "cp", "rem", "sts", "mr", "sr", "iot", "io", "io1", "io2", "ili", "ili1", "ili2", "imi", "ipi", "ie",
]);
const PARA_MARKERS = new Set(["p", "m", "pi", "pi1", "pi2", "pi3", "pc", "pr", "pm", "mi", "nb", "cls", "b"]);
const POETRY_RE = /^(q[1-4]?|qm[1-3]?|qr|qc|qa|li[1-4]?|lim[1-4]?|d)$/;
const STRONG_RE = /strong="([GH]\d+)"/;

export function normalizeStrong(s: string): string {
  const m = /^([GH])0*(\d+)$/.exec(s);
  return m ? `${m[1]}${m[2]}` : s;
}

/** Collapse whitespace across a verse's pieces and trim the ends. */
export function normalizePieces(pieces: Piece[]): Piece[] {
  const out: Piece[] = [];
  let prevEndsSpace = true; // trims the start
  for (const p of pieces) {
    if (typeof p === "string") {
      let s = p.replace(/¶\s*/g, "").replace(/\s+/g, " ");
      s = s.replace(/([\uE000\uE002\uE004]) +/g, "$1").replace(/ +([\uE001\uE003\uE005])/g, "$1");
      if (prevEndsSpace && s.startsWith(" ")) s = s.slice(1);
      if (!s) continue;
      prevEndsSpace = s.endsWith(" ") || /[\uE000\uE002\uE004]$/.test(s);
      const last = out[out.length - 1];
      if (typeof last === "string") out[out.length - 1] = last + s;
      else out.push(s);
    } else {
      out.push(p);
      prevEndsSpace = false;
    }
  }
  const last = out[out.length - 1];
  if (typeof last === "string") {
    const t = last.replace(/ +$/, "");
    if (t) out[out.length - 1] = t;
    else out.pop();
  }
  return out;
}

export function piecesToText(pieces: Piece[]): string {
  return pieces.map((p) => (typeof p === "string" ? p : p[0])).join("");
}

export function parseUsfm(src: string): ParsedBook {
  const warnings: string[] = [];
  const chapters = new Map<number, ParsedChapter>();
  const re = /\\(\+?)([a-z]+[0-9]*)(\*?)/g;

  let chapter: ParsedChapter | null = null;
  let verse: ParsedVerse | null = null;
  let mode: "verse" | "heading" | "title" | "skip" = "heading";
  let pendingPara = false;
  let pendingPoetry = false;
  let inPoetryBlock = false;
  // inline state
  let wordOpen = false;
  let noteBuf: string[] | null = null;
  let noteSkip = false; // inside \fr
  let skipDepth = 0; // inside \x
  let titleBuf = "";

  const emit = (text: string) => {
    if (!text) return;
    if (skipDepth > 0) return;
    if (wordOpen && (mode !== "verse" || noteBuf)) text = text.split("|")[0];
    if (noteBuf) {
      if (!noteSkip) noteBuf.push(text);
      return;
    }
    if (mode === "title") {
      titleBuf += text;
      return;
    }
    if (mode === "verse" && verse) {
      if (wordOpen) {
        const [word, ...attrs] = text.split("|");
        const m = STRONG_RE.exec(attrs.join("|"));
        verse.pieces.push(m ? [word, normalizeStrong(m[1])] : word);
      } else {
        verse.pieces.push(text);
      }
    }
  };

  const startVerse = (n: number) => {
    if (!chapter) {
      warnings.push(`verse ${n} before any chapter`);
      return;
    }
    if (mode === "title") {
      chapter.title = titleBuf.replace(/\s+/g, " ").trim();
    }
    verse = { n, pieces: [], notes: [], paraStart: pendingPara, poetry: inPoetryBlock || pendingPoetry };
    pendingPara = false;
    if (chapter.verses.has(n)) warnings.push(`duplicate verse ${chapter.n}:${n}`);
    chapter.verses.set(n, verse);
    mode = "verse";
  };

  let last = 0;
  let pending: { name: string; plus: boolean; close: boolean } | null = null;
  const handleText = (raw: string) => {
    if (!raw) return;
    if (pending) {
      const { name, close } = pending;
      pending = null;
      if (!close) {
        if (name === "c") {
          const m = /^\s*(\d+)/.exec(raw);
          if (m) {
            const n = Number(m[1]);
            chapter = { n, title: "", verses: new Map() };
            chapters.set(n, chapter);
            verse = null;
            mode = "heading";
            pendingPara = false;
            inPoetryBlock = false;
            pendingPoetry = false;
          }
          return;
        }
        if (name === "v") {
          const m = /^\s*(\d+)(?:-(\d+))?[a-z]?\s?/.exec(raw);
          if (m) {
            startVerse(Number(m[1]));
            if (m[2]) warnings.push(`bridged verse ${chapter?.n}:${m[1]}-${m[2]}`);
            emit(raw.slice(m[0].length));
          }
          return;
        }
      }
    }
    // delimiter after an opening marker is one space
    emit(raw);
  };

  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let text = src.slice(last, m.index);
    last = re.lastIndex;
    // consume the single delimiter space after an opening marker
    const prevPendingOpen = pending && !pending.close;
    if (prevPendingOpen && text.startsWith(" ")) text = text.slice(1);
    if (pending && pending.name !== "c" && pending.name !== "v") {
      // text between previous marker and this one
    }
    handleText(text);
    // an unconsumed pending marker with no text (e.g. "\p" alone)
    pending = null;

    const plus = m[1] === "+";
    const name = m[2];
    const close = m[3] === "*";
    pending = { name, plus, close };

    if (close) {
      if (name === "w") wordOpen = false;
      else if (name === "wj") emitMarker(WJ_CLOSE);
      else if (name === "add") emitMarker(ADD_CLOSE);
      else if (name === "nd") emitMarker(ND_CLOSE);
      else if (name === "f" || name === "fe") {
        if (noteBuf && verse) {
          const t = noteBuf.join("").replace(/\s+/g, " ").replace(/^[+\-?]\s*/, "").trim();
          verse.notes.push(t);
          verse.pieces.push(NOTE_ANCHOR);
        }
        noteBuf = null;
        noteSkip = false;
      } else if (name === "x") skipDepth = Math.max(0, skipDepth - 1);
      continue;
    }
    // opening / block markers
    if (name === "c" || name === "v") continue;
    if (name === "w") {
      wordOpen = true;
    } else if (name === "wj") emitMarker(WJ_OPEN);
    else if (name === "add") emitMarker(ADD_OPEN);
    else if (name === "nd") emitMarker(ND_OPEN);
    else if (name === "f" || name === "fe") {
      noteBuf = [];
      noteSkip = false;
    } else if (name === "fr" || name === "fk") {
      noteSkip = name === "fr";
      if (name === "fk") noteSkip = false;
    } else if (name === "ft" || name === "fq" || name === "fqa" || name === "fv" || name === "fl") {
      noteSkip = false;
    } else if (name === "x") skipDepth++;
    else if (!plus && (PARA_MARKERS.has(name) || POETRY_RE.test(name) || HEADING_MARKERS.has(name))) {
      // block level marker
      if (noteBuf) continue;
      if (name === "d") {
        if (chapter && chapter.verses.size === 0) {
          mode = "title";
          titleBuf = chapter.title ? chapter.title + " " : "";
        } else mode = "heading"; // mid chapter label such as a Hebrew letter: dropped
        inPoetryBlock = false;
        continue;
      }
      if (mode === "title") {
        if (chapter) chapter.title = titleBuf.replace(/\s+/g, " ").trim();
        mode = "heading";
      }
      if (HEADING_MARKERS.has(name)) {
        mode = "heading";
        continue;
      }
      if (POETRY_RE.test(name)) {
        pendingPoetry = true;
        if (!inPoetryBlock) pendingPara = true;
        inPoetryBlock = true;
        mode = verse ? "verse" : "heading";
      } else {
        // paragraph style
        pendingPara = true;
        inPoetryBlock = false;
        pendingPoetry = false;
        mode = verse ? "verse" : "heading";
      }
      if (name === "b") pendingPara = true;
    }
  }
  handleText(src.slice(last).replace(/^ /, ""));
  if (mode === "title" && chapter) (chapter as ParsedChapter).title = titleBuf.replace(/\s+/g, " ").trim();

  function emitMarker(ch: string) {
    if (mode === "verse" && verse && !noteBuf && skipDepth === 0) verse.pieces.push(ch);
  }
  return { chapters, warnings };
}
