import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Columns2, Copy, Headphones, Library, Link2, NotebookPen, Pause, SlidersHorizontal, Square, Highlighter, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NotesBanner } from "@/components/NotesBanner";
import { ReadingOptions } from "@/components/ReadingOptions";
import { BookNavAll } from "@/components/reader/BookNav";
import { ChapterView, type Token } from "@/components/reader/ChapterView";
import { CompareView, type CompareColumn } from "@/components/reader/CompareView";
import { StudyPanel, type PanelTab } from "@/components/reader/StudyPanel";
import { HighlightPicker } from "@/components/notes/HighlightPicker";
import { useAsync, useMediaQuery } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS, bookIndexFromSlug } from "@/lib/canon/books";
import { chapterCount, fromId, toId, verseCount } from "@/lib/canon/canon";
import { loadBookNotes, loadBookText, rangeText } from "@/lib/data/text";
import { loadKjvTokens } from "@/lib/data/strongs";
import { readPath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { chapterNeighbors, extendSelection, formatVerseParam, parseVerseParam, type Selection } from "@/lib/reader";
import { readAloud, speechSupported, type Reader as AloudReader } from "@/lib/speech";
import { appUrl, copyText, formatCopy } from "@/lib/share/format";
import { useStoreQuery } from "@/lib/store/hooks";
import { highlightsInRange, listBookmarks, listNotes } from "@/lib/store/repo";
import { DEFAULT_TRANSLATION, isTranslationId, TRANSLATIONS, translationById } from "@/lib/translations";

function useIsTyping() {
  return useCallback((e: Event) => {
    const t = e.target as HTMLElement | null;
    return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
  }, []);
}

export function Component() {
  const params = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const prefs = usePrefs();
  const wide = useMediaQuery("(min-width: 1024px)");
  const xl = useMediaQuery("(min-width: 1280px)");
  const typing = useIsTyping();

  const book = bookIndexFromSlug(params.book ?? "");
  const chapter = Number(params.chapter ?? 1);
  const valid = book >= 0 && Number.isInteger(chapter) && chapter >= 1 && chapter <= chapterCount(book);

  const trParam = sp.get("t");
  const tr = trParam && isTranslationId(trParam) ? trParam : prefs.translation;
  const withList = (sp.get("with") ?? "").split(",").filter((x) => isTranslationId(x) && x !== tr);
  const maxV = valid ? verseCount(book, chapter) : 0;
  const selection = valid ? parseVerseParam(sp.get("v"), 200) : null;
  const panelParam = sp.get("panel");
  const tab: PanelTab = panelParam === "notes" || panelParam === "words" || panelParam === "share" ? panelParam : "xref";
  const originalWords = sp.get("ow") === "1" && tr === "kjv";
  const compare = withList.length > 0;

  const update = useCallback(
    (patch: Record<string, string | null>, replace = true) => {
      const next = new URLSearchParams(sp);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      setSp(next, { replace });
    },
    [sp, setSp],
  );

  // remember the place
  useEffect(() => {
    if (valid) usePrefs.getState().set({ last: { book, chapter } });
  }, [valid, book, chapter]);

  const title = valid ? `${BOOKS[book].name} ${chapter} (${translationById(tr).short})` : "Chapter not found";
  useDocumentTitle(title);

  // data
  const text = useAsync(() => (valid ? loadBookText(tr, book) : Promise.resolve(undefined)), [tr, book, valid]);
  const notesAsync = useAsync(() => (valid ? loadBookNotes(tr, book) : Promise.resolve([])), [tr, book, valid]);
  const compareTexts = useAsync(
    () => (valid && compare ? Promise.all(withList.map(async (t) => ({ t, text: await loadBookText(t, book), notes: await loadBookNotes(t, book) }))) : Promise.resolve([])),
    [withList.join(","), book, valid, compare],
  );
  const tokensAsync = useAsync(() => (valid && originalWords ? loadKjvTokens(book) : Promise.resolve(undefined)), [book, valid, originalWords]);

  const chapterData = text.data?.c[chapter - 1];
  const footnotes = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const [c, v, ns] of notesAsync.data ?? []) if (c === chapter) m.set(v, ns);
    return m;
  }, [notesAsync.data, chapter]);
  const tokens: Token[][] | undefined = tokensAsync.data?.c[chapter - 1] as Token[][] | undefined;

  const first = valid ? toId(book, chapter, 1) : 0;
  const last = valid ? toId(book, chapter, maxV) : 0;
  const { data: hlMap } = useStoreQuery(() => highlightsInRange(first, last), new Map(), [first, last]);
  const { data: allNotes } = useStoreQuery(listNotes, []);
  const { data: bms } = useStoreQuery(listBookmarks, []);
  const noted = useMemo(() => {
    const s = new Set<number>();
    for (const n of allNotes) for (let id = Math.max(n.start, first); id <= Math.min(n.end, last); id++) s.add(id);
    return s;
  }, [allNotes, first, last]);
  const bookmarked = useMemo(() => {
    const s = new Set<number>();
    for (const b of bms) for (let id = Math.max(b.start, first); id <= Math.min(b.end, last); id++) s.add(id);
    return s;
  }, [bms, first, last]);

  // selection
  const [rangeMode, setRangeMode] = useState(false);
  const onVerse = useCallback(
    (v: number, extend: boolean) => {
      let next: Selection | null;
      if (extend || rangeMode) next = extendSelection(selection, v);
      else if (selection && selection[0] === v && selection[1] === v) next = null;
      else next = [v, v];
      update({ v: formatVerseParam(next) });
    },
    [selection, rangeMode, update],
  );
  const selStart = valid && selection ? toId(book, chapter, selection[0]) : 0;
  const selEnd = valid && selection ? toId(book, chapter, Math.min(selection[1], maxV)) : 0;
  const hasSel = !!selection && valid;

  // scroll the selection into view when the chapter opens
  const scrolled = useRef("");
  useEffect(() => {
    if (!chapterData) return;
    const key = `${book}.${chapter}`;
    if (scrolled.current === key) return;
    scrolled.current = key;
    if (selection) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`v${selection[0]}`);
        el?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
    } else window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterData, book, chapter]);

  // study panel for narrow screens
  const [drawer, setDrawer] = useState(false);
  const [activeStrong, setActiveStrong] = useState<string | null>(null);
  const openTab = (t: PanelTab) => {
    update({ panel: t === "xref" ? null : t });
    if (!wide) setDrawer(true);
  };
  const [navOpen, setNavOpen] = useState(false);

  // actions
  const copyPlain = useCallback(async () => {
    if (!hasSel) return;
    const verses = await rangeText(tr, selStart, selEnd, 60);
    const ok = await copyText(formatCopy({ start: selStart, end: selEnd, tr, verses }, "plain"));
    if (ok) toast.success(`Copied ${BOOKS[book].name} ${chapter}:${selection![0]}${selection![0] !== selection![1] ? `-${selection![1]}` : ""}`);
    else toast.error("Could not copy. Select the text and copy it by hand.");
  }, [hasSel, tr, selStart, selEnd, book, chapter, selection]);

  // read aloud
  const [aloud, setAloud] = useState<"off" | "playing" | "paused">("off");
  const aloudRef = useRef<AloudReader | null>(null);
  useEffect(() => () => aloudRef.current?.stop(), []);
  useEffect(() => {
    aloudRef.current?.stop();
  }, [book, chapter, tr]);
  const startAloud = () => {
    if (!chapterData) return;
    const from = selection ? selection[0] : 1;
    const items = chapterData.v.slice(from - 1).map((t) => t.replace(/[-]/g, ""));
    aloudRef.current = readAloud(
      items,
      (i) => {
        update({ v: String(from + i) });
        document.getElementById(`v${from + i}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      },
      () => setAloud("off"),
    );
    setAloud("playing");
  };

  // keyboard shortcuts
  useEffect(() => {
    if (!valid) return;
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const { prev, next } = chapterNeighbors(book, chapter);
      const cur = selection?.[1] ?? 0;
      switch (e.key) {
        case "j":
          if (cur < maxV) {
            update({ v: String(cur + 1) });
            document.getElementById(`v${cur + 1}`)?.focus();
          }
          break;
        case "k":
          if (cur > 1) {
            update({ v: String(cur - 1) });
            document.getElementById(`v${cur - 1}`)?.focus();
          }
          break;
        case "]":
          if (next) navigate(readPath(next.book, next.chapter, sp.toString().replace(/(^|&)v=[^&]*/, "") ? `?${new URLSearchParams([...sp].filter(([k]) => k !== "v")).toString()}` : ""));
          break;
        case "[":
          if (prev) navigate(readPath(prev.book, prev.chapter, sp.toString().replace(/(^|&)v=[^&]*/, "") ? `?${new URLSearchParams([...sp].filter(([k]) => k !== "v")).toString()}` : ""));
          break;
        case "x":
          if (hasSel) openTab("xref");
          break;
        case "n":
          if (hasSel) {
            e.preventDefault();
            openTab("notes");
          }
          break;
        case "h":
          if (hasSel) openTab("notes");
          break;
        case "b":
          if (hasSel) openTab("notes");
          break;
        case "c":
          if (hasSel) void copyPlain();
          break;
        case "Escape":
          if (selection) update({ v: null });
          break;
        default:
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!valid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl">That chapter does not exist</h1>
        <p className="mt-2 text-muted-foreground">Check the address, or pick a book to start reading.</p>
        <Button className="mt-4" asChild>
          <Link to="/read/john/1">Read John 1</Link>
        </Button>
      </div>
    );
  }

  const { prev, next } = chapterNeighbors(book, chapter);
  const keepQuery = (() => {
    const q = new URLSearchParams(sp);
    q.delete("v");
    q.delete("panel");
    const s = q.toString();
    return s ? `?${s}` : "";
  })();
  const shareQuery = (() => {
    const q = new URLSearchParams();
    if (selection) q.set("v", formatVerseParam(selection)!);
    q.set("t", tr);
    if (withList.length) q.set("with", withList.join(","));
    return `?${q.toString()}`;
  })();

  const panel = hasSel ? (
    <StudyPanel
      start={selStart}
      end={selEnd}
      tr={tr}
      tab={tab}
      onTab={(t) => update({ panel: t === "xref" ? null : t })}
      shareQuery={shareQuery}
      activeStrong={activeStrong}
      onStrong={setActiveStrong}
      onTranslation={(t) => update({ t })}
      onClose={() => {
        setDrawer(false);
        update({ v: null, panel: null });
      }}
    />
  ) : null;

  return (
    <div className="mx-auto flex w-full max-w-[88rem]">
      {xl && (
        <aside className="sticky top-14 h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r px-2 py-4" aria-label="Books">
          <BookNavAll book={book} chapter={chapter} query={keepQuery} />
        </aside>
      )}
      <div className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-8 md:pt-6">
        <NotesBanner className="mb-4 max-w-2xl" />
        <div className="no-print sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-2 border-b bg-page/95 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
          {!xl && (
            <Button variant="outline" onClick={() => setNavOpen(true)} className="gap-2 font-semibold" aria-label={`${BOOKS[book].name} ${chapter}. Change book or chapter`}>
              <Library aria-hidden="true" /> {BOOKS[book].name} {chapter}
            </Button>
          )}
          {xl && <h1 className="mr-2 text-xl">{BOOKS[book].name} {chapter}</h1>}
          <div className="hidden items-center sm:flex">
            <Button variant="ghost" size="icon" asChild={!!prev} disabled={!prev} aria-label="Previous chapter">
              {prev ? <Link to={readPath(prev.book, prev.chapter, keepQuery)}><ChevronLeft aria-hidden="true" /></Link> : <ChevronLeft aria-hidden="true" />}
            </Button>
            <Button variant="ghost" size="icon" asChild={!!next} disabled={!next} aria-label="Next chapter">
              {next ? <Link to={readPath(next.book, next.chapter, keepQuery)}><ChevronRight aria-hidden="true" /></Link> : <ChevronRight aria-hidden="true" />}
            </Button>
          </div>
          <Select value={tr} onValueChange={(t) => update({ t, with: withList.filter((w) => w !== t).join(",") || null, ow: t === "kjv" ? sp.get("ow") : null })}>
            <SelectTrigger className="h-11 w-[5.75rem] sm:h-10 sm:w-[7.5rem]" aria-label="Translation">
              <SelectValue>{translationById(tr).short}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TRANSLATIONS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.short} <span className="text-muted-foreground">{t.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={compare ? "default" : "outline"} className="gap-2" aria-label="Compare translations">
                <Columns2 aria-hidden="true" /> <span className="hidden sm:inline">Compare</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              <p className="mb-2 text-sm font-medium">Compare {translationById(tr).short} with</p>
              <ToggleGroup type="multiple" variant="outline" value={withList} onValueChange={(v) => update({ with: v.join(",") || null })} className="flex-wrap justify-start">
                {TRANSLATIONS.filter((t) => t.id !== tr).map((t) => (
                  <ToggleGroupItem key={t.id} value={t.id} aria-label={t.name}>{t.short}</ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="mt-2 text-xs text-muted-foreground">Verses line up side by side. On a phone each verse shows every translation in turn.</p>
            </PopoverContent>
          </Popover>
          {tr === "kjv" && !compare && (
            <div className="hidden items-center gap-2 lg:flex">
              <Switch id="ow" checked={originalWords} onCheckedChange={(v) => update({ ow: v ? "1" : null, panel: v ? "words" : sp.get("panel") })} />
              <Label htmlFor="ow" className="text-sm">Original words</Label>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            {speechSupported() && !compare && (
              aloud === "off" ? (
                <Button variant="ghost" size="icon" onClick={startAloud} aria-label="Read this chapter aloud">
                  <Headphones aria-hidden="true" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="icon" onClick={() => (aloud === "playing" ? (aloudRef.current?.pause(), setAloud("paused")) : (aloudRef.current?.resume(), setAloud("playing")))} aria-label={aloud === "playing" ? "Pause reading" : "Resume reading"}>
                    {aloud === "playing" ? <Pause aria-hidden="true" /> : <Headphones aria-hidden="true" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => aloudRef.current?.stop()} aria-label="Stop reading aloud">
                    <Square aria-hidden="true" />
                  </Button>
                </>
              )
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Reading options">
                  <SlidersHorizontal aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <ReadingOptions />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {text.loading && !chapterData ? (
          <div className="grid max-w-xl gap-3" aria-busy="true" aria-label="Loading the chapter">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : text.error || !chapterData ? (
          <div className="max-w-xl rounded-md border p-4" role="alert">
            <p className="font-medium">This chapter could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">If you are offline, open a chapter you have read before, or reconnect and try again.</p>
            <Button className="mt-3" onClick={() => window.location.reload()}>Try again</Button>
          </div>
        ) : compare ? (
          <CompareView
            book={book}
            chapter={chapter}
            selection={selection}
            onVerse={onVerse}
            columns={[
              { tr, data: chapterData, notes: footnotes } as CompareColumn,
              ...(compareTexts.data ?? []).map((c) => ({ tr: c.t, data: c.text.c[chapter - 1], notes: new Map(c.notes.filter(([ch]) => ch === chapter).map(([, v, ns]) => [v, ns] as [number, string[]])) })),
            ]}
          />
        ) : (
          <ChapterView
            book={book}
            chapter={chapter}
            data={chapterData}
            footnotes={footnotes}
            tokens={originalWords ? tokens : undefined}
            selection={selection}
            onVerse={onVerse}
            highlights={hlMap}
            noted={noted}
            bookmarked={bookmarked}
            layout={prefs.verseLayout}
            activeStrong={activeStrong}
            onStrong={(num, v) => {
              setActiveStrong(num);
              update({ v: String(v), panel: "words" });
              if (!wide) setDrawer(true);
            }}
          />
        )}

        <nav aria-label="Chapter navigation" className="no-print mt-8 flex max-w-xl justify-between gap-3">
          {prev ? (
            <Button variant="outline" asChild>
              <Link to={readPath(prev.book, prev.chapter, keepQuery)}><ChevronLeft aria-hidden="true" /> {BOOKS[prev.book].name} {prev.chapter}</Link>
            </Button>
          ) : <span />}
          {next ? (
            <Button variant="outline" asChild>
              <Link to={readPath(next.book, next.chapter, keepQuery)}>{BOOKS[next.book].name} {next.chapter} <ChevronRight aria-hidden="true" /></Link>
            </Button>
          ) : <span />}
        </nav>
        <p className="no-print mt-6 max-w-xl text-sm text-muted-foreground">
          Tap a verse to see its connections, add a note or share it. Shift-click or turn on range mode to pick several verses.
        </p>
      </div>

      {wide && hasSel && (
        <aside className="sticky top-14 h-[calc(100dvh-3.5rem)] w-[24rem] shrink-0 border-l bg-surface xl:w-[26rem]" aria-label="Study panel">
          {panel}
        </aside>
      )}

      {/* phone and tablet: action bar and bottom sheet */}
      {!wide && hasSel && (
        <div className="no-print fixed inset-x-0 bottom-14 z-30 flex items-center gap-1 border-t bg-surface px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-lg md:bottom-0" role="toolbar" aria-label="Actions for the selected verses" data-testid="action-bar">
          <Button variant="ghost" className="flex-1 flex-col gap-0.5 h-auto py-1.5 text-xs" onClick={copyPlain} aria-label="Copy"><Copy aria-hidden="true" />Copy</Button>
          <Button variant="ghost" className="flex-1 flex-col gap-0.5 h-auto py-1.5 text-xs" onClick={() => openTab("notes")} aria-label="Note"><NotebookPen aria-hidden="true" />Note</Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="flex-1 flex-col gap-0.5 h-auto py-1.5 text-xs" aria-label="Highlight"><Highlighter aria-hidden="true" />Mark</Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto">
              <HighlightPicker ids={Array.from({ length: selEnd - selStart + 1 }, (_, i) => selStart + i)} current={hlMap.get(selStart)} />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" className="flex-1 flex-col gap-0.5 h-auto py-1.5 text-xs" onClick={() => openTab("xref")} aria-label="Links"><Link2 aria-hidden="true" />Links</Button>
          <Button variant="ghost" className="flex-1 flex-col gap-0.5 h-auto py-1.5 text-xs" onClick={() => openTab("share")} aria-label="Share"><Share2 aria-hidden="true" />Share</Button>
          <Button variant={rangeMode ? "default" : "ghost"} className="flex-1 flex-col gap-0.5 h-auto py-1.5 text-xs" aria-pressed={rangeMode} onClick={() => setRangeMode((r) => !r)} aria-label="Select a range of verses">Range</Button>
        </div>
      )}
      {!wide && (
        <Drawer open={drawer && hasSel} onOpenChange={setDrawer}>
          <DrawerContent className="max-h-[88dvh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Study panel</DrawerTitle>
              <DrawerDescription>Connections, notes, word study and sharing for the selected verses</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-hidden" style={{ height: "80dvh" }}>{panel}</div>
          </DrawerContent>
        </Drawer>
      )}

      {!xl && (
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto px-2">
            <SheetHeader>
              <SheetTitle>Books and chapters</SheetTitle>
              <SheetDescription className="sr-only">Choose a book and chapter to read</SheetDescription>
            </SheetHeader>
            <BookNavAll book={book} chapter={chapter} query={keepQuery} onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export { appUrl, fromId };
