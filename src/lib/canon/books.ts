/**
 * Static facts about the 66 books of the Protestant canon.
 * Shared by the app and the data pipeline (scripts/), so keep it dependency free.
 */
export type Testament = "ot" | "nt";
export type Section =
  | "Law"
  | "History"
  | "Wisdom and poetry"
  | "Major prophets"
  | "Minor prophets"
  | "Gospels"
  | "Acts"
  | "Paul's letters"
  | "General letters"
  | "Revelation";

export interface Book {
  /** OSIS id, as used by OpenBible (Gen, Exod, 1Cor ...) */
  osis: string;
  /** USFM id, as used in eBible file names */
  usfm: string;
  /** URL slug */
  slug: string;
  name: string;
  /** Short label for tight spaces (arc view, heat map) */
  short: string;
  testament: Testament;
  section: Section;
  /** Extra names people type, lower case, any punctuation */
  aliases: string[];
}

type Row = [osis: string, usfm: string, name: string, short: string, section: Section, aliases: string];

const rows: Row[] = [
  ["Gen", "GEN", "Genesis", "Gen", "Law", "gn ge gen"],
  ["Exod", "EXO", "Exodus", "Exod", "Law", "ex exo exod"],
  ["Lev", "LEV", "Leviticus", "Lev", "Law", "lv le lev levit"],
  ["Num", "NUM", "Numbers", "Num", "Law", "nu nm nb num numb"],
  ["Deut", "DEU", "Deuteronomy", "Deut", "Law", "dt de deu deut"],
  ["Josh", "JOS", "Joshua", "Josh", "History", "jos josh jsh"],
  ["Judg", "JDG", "Judges", "Judg", "History", "jdg jg jdgs judg"],
  ["Ruth", "RUT", "Ruth", "Ruth", "History", "ru rut rth"],
  ["1Sam", "1SA", "1 Samuel", "1 Sam", "History", "1sa 1sm 1s 1sam isam firstsamuel"],
  ["2Sam", "2SA", "2 Samuel", "2 Sam", "History", "2sa 2sm 2s 2sam iisam secondsamuel"],
  ["1Kgs", "1KI", "1 Kings", "1 Kgs", "History", "1ki 1kgs 1kg 1k ikings firstkings"],
  ["2Kgs", "2KI", "2 Kings", "2 Kgs", "History", "2ki 2kgs 2kg 2k iikings secondkings"],
  ["1Chr", "1CH", "1 Chronicles", "1 Chr", "History", "1ch 1chr 1chron ichronicles firstchronicles"],
  ["2Chr", "2CH", "2 Chronicles", "2 Chr", "History", "2ch 2chr 2chron iichronicles secondchronicles"],
  ["Ezra", "EZR", "Ezra", "Ezra", "History", "ezr ez"],
  ["Neh", "NEH", "Nehemiah", "Neh", "History", "ne neh"],
  ["Esth", "EST", "Esther", "Esth", "History", "es est esth"],
  ["Job", "JOB", "Job", "Job", "Wisdom and poetry", "jb job"],
  ["Ps", "PSA", "Psalms", "Ps", "Wisdom and poetry", "ps psa psalm pslm psm pss psalms"],
  ["Prov", "PRO", "Proverbs", "Prov", "Wisdom and poetry", "pr prv pro prov"],
  ["Eccl", "ECC", "Ecclesiastes", "Eccl", "Wisdom and poetry", "ec ecc eccl eccles qoheleth"],
  ["Song", "SNG", "Song of Solomon", "Song", "Wisdom and poetry", "sos ss song sg sng songofsongs songofsolomon canticles cant"],
  ["Isa", "ISA", "Isaiah", "Isa", "Major prophets", "is isa"],
  ["Jer", "JER", "Jeremiah", "Jer", "Major prophets", "je jer jr"],
  ["Lam", "LAM", "Lamentations", "Lam", "Major prophets", "la lam"],
  ["Ezek", "EZK", "Ezekiel", "Ezek", "Major prophets", "eze ezk ezek"],
  ["Dan", "DAN", "Daniel", "Dan", "Major prophets", "da dn dan"],
  ["Hos", "HOS", "Hosea", "Hos", "Minor prophets", "ho hos"],
  ["Joel", "JOL", "Joel", "Joel", "Minor prophets", "jl joe jol joel"],
  ["Amos", "AMO", "Amos", "Amos", "Minor prophets", "am amo"],
  ["Obad", "OBA", "Obadiah", "Obad", "Minor prophets", "ob oba obad"],
  ["Jonah", "JON", "Jonah", "Jonah", "Minor prophets", "jnh jon jonah"],
  ["Mic", "MIC", "Micah", "Mic", "Minor prophets", "mi mic"],
  ["Nah", "NAM", "Nahum", "Nah", "Minor prophets", "na nah nam"],
  ["Hab", "HAB", "Habakkuk", "Hab", "Minor prophets", "hab hb"],
  ["Zeph", "ZEP", "Zephaniah", "Zeph", "Minor prophets", "zep zph zeph"],
  ["Hag", "HAG", "Haggai", "Hag", "Minor prophets", "hag hg"],
  ["Zech", "ZEC", "Zechariah", "Zech", "Minor prophets", "zec zch zech"],
  ["Mal", "MAL", "Malachi", "Mal", "Minor prophets", "mal ml"],
  ["Matt", "MAT", "Matthew", "Matt", "Gospels", "mt mat matt"],
  ["Mark", "MRK", "Mark", "Mark", "Gospels", "mk mr mrk mark"],
  ["Luke", "LUK", "Luke", "Luke", "Gospels", "lk lu luk luke"],
  ["John", "JHN", "John", "John", "Gospels", "jn jhn joh john"],
  ["Acts", "ACT", "Acts", "Acts", "Acts", "ac act acts"],
  ["Rom", "ROM", "Romans", "Rom", "Paul's letters", "ro rm rom roman"],
  ["1Cor", "1CO", "1 Corinthians", "1 Cor", "Paul's letters", "1co 1cor icor icorinthians firstcorinthians"],
  ["2Cor", "2CO", "2 Corinthians", "2 Cor", "Paul's letters", "2co 2cor iicor iicorinthians secondcorinthians"],
  ["Gal", "GAL", "Galatians", "Gal", "Paul's letters", "ga gal"],
  ["Eph", "EPH", "Ephesians", "Eph", "Paul's letters", "ep eph ephes"],
  ["Phil", "PHP", "Philippians", "Phil", "Paul's letters", "php pp phil philip"],
  ["Col", "COL", "Colossians", "Col", "Paul's letters", "co col"],
  ["1Thess", "1TH", "1 Thessalonians", "1 Thess", "Paul's letters", "1th 1thes 1thess 1thessalonians ithess firstthessalonians"],
  ["2Thess", "2TH", "2 Thessalonians", "2 Thess", "Paul's letters", "2th 2thes 2thess 2thessalonians iithess secondthessalonians"],
  ["1Tim", "1TI", "1 Timothy", "1 Tim", "Paul's letters", "1ti 1tm 1tim itim firsttimothy"],
  ["2Tim", "2TI", "2 Timothy", "2 Tim", "Paul's letters", "2ti 2tm 2tim iitim secondtimothy"],
  ["Titus", "TIT", "Titus", "Titus", "Paul's letters", "ti tit titus"],
  ["Phlm", "PHM", "Philemon", "Phlm", "Paul's letters", "phm phlm philem"],
  ["Heb", "HEB", "Hebrews", "Heb", "General letters", "he heb"],
  ["Jas", "JAS", "James", "James", "General letters", "jm jas jam james"],
  ["1Pet", "1PE", "1 Peter", "1 Pet", "General letters", "1pe 1pt 1pet ipeter firstpeter"],
  ["2Pet", "2PE", "2 Peter", "2 Pet", "General letters", "2pe 2pt 2pet iipeter secondpeter"],
  ["1John", "1JN", "1 John", "1 John", "General letters", "1jn 1jo 1joh 1john ijohn firstjohn"],
  ["2John", "2JN", "2 John", "2 John", "General letters", "2jn 2jo 2joh 2john iijohn secondjohn"],
  ["3John", "3JN", "3 John", "3 John", "General letters", "3jn 3jo 3joh 3john iiijohn thirdjohn"],
  ["Jude", "JUD", "Jude", "Jude", "General letters", "jde jd jude"],
  ["Rev", "REV", "Revelation", "Rev", "Revelation", "re rv rev revelations apocalypse revelationofjohn"],
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const BOOKS: readonly Book[] = rows.map(([osis, usfm, name, short, section, aliases], i) => ({
  osis,
  usfm,
  slug: slugify(name),
  name,
  short,
  testament: i < 39 ? "ot" : "nt",
  section,
  aliases: aliases.split(" "),
}));

export const BOOK_COUNT = BOOKS.length;
export const OT_BOOK_COUNT = 39;

const byOsis = new Map(BOOKS.map((b, i) => [b.osis, i]));
const bySlug = new Map(BOOKS.map((b, i) => [b.slug, i]));
const byUsfm = new Map(BOOKS.map((b, i) => [b.usfm, i]));

export function bookIndexFromOsis(osis: string): number {
  const i = byOsis.get(osis);
  return i === undefined ? -1 : i;
}
export function bookIndexFromSlug(slug: string): number {
  const i = bySlug.get(slug.toLowerCase());
  return i === undefined ? -1 : i;
}
export function bookIndexFromUsfm(usfm: string): number {
  const i = byUsfm.get(usfm.toUpperCase());
  return i === undefined ? -1 : i;
}
