import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, Hash, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Highlighted } from "@/components/Highlighted";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS } from "@/lib/canon/books";
import { fromId } from "@/lib/canon/canon";
import { formatPassage, formatVerseId } from "@/lib/canon/parse";
import { passagePath, versePath } from "@/lib/nav";
import { usePrefs } from "@/lib/prefs";
import { runSearch, warmSearch } from "@/lib/search/client";
import { normalize, parseQuery } from "@/lib/search/query";
import { isTranslationId, TRANSLATIONS, translationById } from "@/lib/translations";

const PAGE = 100;

export function Component() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const prefTr = usePrefs((s) => s.translation);
  const q = sp.get("q") ?? "";
  const tr = isTranslationId(sp.get("t") ?? "") ? sp.get("t")! : prefTr;
  const scope = sp.get("scope") ?? "all";
  const mode = sp.get("mode") === "phrase" ? "phrase" : "words";
  const [draft, setDraft] = useState(q);
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => setShown(PAGE), [q, tr, scope, mode]);
  useDocumentTitle(q ? `Search: ${q}` : "Search");

  const parsed = useMemo(() => parseQuery(q), [q]);
  const words = mode === "phrase" && !parsed.phrases.length ? [] : parsed.words;
  const phrases = mode === "phrase" && !parsed.phrases.length && parsed.words.length ? [parsed.words.join(" ")] : parsed.phrases;
  const hasText = words.length + phrases.length > 0 && !parsed.strongs;

  // start building the index as soon as someone opens the page
  useEffect(() => {
    void warmSearch(tr).catch(() => undefined);
  }, [tr]);

  const res = useAsync(() => (hasText ? runSearch({ tr, words, phrases, scope, limit: 2000 }) : Promise.resolve(null)), [q, tr, scope, mode, hasText]);
  const terms = useMemo(() => [...words.map(normalize), ...phrases], [words, phrases]);

  const set = (patch: Record<string, string | null>) => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) (v === null || v === "" ? n.delete(k) : n.set(k, v));
    setSp(n);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseQuery(draft);
    if (p.reference && !p.words.length) {
      navigate(passagePath(p.reference));
      return;
    }
    if (p.reference && /^\S+\s+\d+(:\d+)?(-\d+)?$/.test(draft.trim()) ) {
      navigate(passagePath(p.reference));
      return;
    }
    set({ q: draft.trim() });
  };

  const grouped = useMemo(() => {
    const m = new Map<number, { id: number; text: string }[]>();
    for (const h of res.data?.hits.slice(0, shown) ?? []) {
      const b = fromId(h.id).book;
      m.set(b, [...(m.get(b) ?? []), h]);
    }
    return [...m];
  }, [res.data, shown]);
  const maxBook = Math.max(1, ...(res.data?.byBook ?? [1]));
  const scopeBook = BOOKS.find((b) => b.osis === scope);

  return (
    <Page wide title="Search the Bible" intro="Find words, phrases or a reference. Try love, &quot;living water&quot;, or Jn 3:16.">
      <form onSubmit={submit} role="search" className="mb-4 flex max-w-3xl flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Label htmlFor="q" className="sr-only">Search</Label>
          <Input id="q" value={draft} onChange={(e) => setDraft(e.target.value)} className="h-11 pl-9 text-base" placeholder="love, &quot;living water&quot;, Jn 3:16" autoComplete="off" autoCapitalize="none" enterKeyHint="search" />
        </div>
        <Button type="submit" className="h-11">Search</Button>
      </form>

      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="grid gap-1.5">
          <Label id="s-scope">Where</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={["all", "ot", "nt"].includes(scope) ? scope : "book"} onValueChange={(v) => v && v !== "book" && set({ scope: v === "all" ? null : v })} aria-labelledby="s-scope">
            <ToggleGroupItem value="all">Whole Bible</ToggleGroupItem>
            <ToggleGroupItem value="ot">Old Testament</ToggleGroupItem>
            <ToggleGroupItem value="nt">New Testament</ToggleGroupItem>
            {scopeBook && <ToggleGroupItem value="book">{scopeBook.name}</ToggleGroupItem>}
          </ToggleGroup>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="s-book">One book</Label>
          <Select value={scopeBook ? scopeBook.osis : ""} onValueChange={(v) => set({ scope: v })}>
            <SelectTrigger id="s-book" className="w-44"><SelectValue placeholder="Choose a book" /></SelectTrigger>
            <SelectContent className="max-h-80">{BOOKS.map((b) => <SelectItem key={b.osis} value={b.osis}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label id="s-tr">Translation</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={tr} onValueChange={(v) => v && set({ t: v })} aria-labelledby="s-tr">
            {TRANSLATIONS.map((t) => <ToggleGroupItem key={t.id} value={t.id}>{t.short}</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
        <div className="grid gap-1.5">
          <Label id="s-mode">Match</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={(v) => v && set({ mode: v === "words" ? null : v })} aria-labelledby="s-mode">
            <ToggleGroupItem value="words">All the words</ToggleGroupItem>
            <ToggleGroupItem value="phrase">Exact phrase</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {parsed.reference && (
        <Link to={passagePath(parsed.reference)} className="mb-3 flex max-w-3xl items-center justify-between rounded-md border bg-surface p-3 no-underline hover:bg-accent" data-testid="go-to">
          <span className="font-semibold text-foreground">Go to {formatPassage(parsed.reference)}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
      {parsed.strongs && (
        <Link to={`/word/${parsed.strongs}`} className="mb-3 flex max-w-3xl items-center justify-between rounded-md border bg-surface p-3 no-underline hover:bg-accent">
          <span className="flex items-center gap-2 font-semibold text-foreground"><Hash className="size-4" aria-hidden="true" /> Word study for {parsed.strongs}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}

      {hasText && (
        <section aria-label="Results" aria-live="polite" aria-busy={res.loading}>
          {res.loading ? (
            <div className="max-w-3xl">
              <p className="mb-3 text-sm text-muted-foreground">Preparing the search. The first search in a visit takes a few seconds.</p>
              <Skeleton className="mb-2 h-16 w-full" />
              <Skeleton className="mb-2 h-16 w-full" />
            </div>
          ) : res.error ? (
            <p role="alert" className="text-destructive">The search could not run. If you are offline, open the app once while online so the text can be saved, then try again.</p>
          ) : res.data && res.data.total === 0 ? (
            <p className="max-w-3xl rounded-md border border-dashed p-4">No verses match &ldquo;{q}&rdquo;. Check the spelling or try another translation.</p>
          ) : res.data ? (
            <>
              <p className="mb-3 text-sm text-muted-foreground" data-testid="result-count">
                {res.data.total.toLocaleString()} {res.data.total === 1 ? "verse" : "verses"} in the {translationById(tr).short}
                {scopeBook ? ` in ${scopeBook.name}` : scope === "ot" ? " in the Old Testament" : scope === "nt" ? " in the New Testament" : ""}.
              </p>
              {scope === "all" || scope === "ot" || scope === "nt" ? (
                <div className="mb-6 max-w-4xl">
                  <h2 className="mb-1 text-base">Where it appears</h2>
                  <div className="flex h-20 items-end gap-px" role="group" aria-label="Matches in each book. Choose a bar to search only that book.">
                    {BOOKS.map((b, i) => {
                      const n = res.data!.byBook[i];
                      return (
                        <button
                          key={b.osis}
                          type="button"
                          className="group relative flex h-full min-w-0 flex-1 items-end"
                          onClick={() => set({ scope: b.osis })}
                          aria-label={`${b.name}: ${n} ${n === 1 ? "match" : "matches"}`}
                          title={`${b.name}: ${n}`}
                        >
                          <span className="block w-full rounded-t-[2px]" style={{ height: n ? `${Math.max(6, (n / maxBook) * 100)}%` : "2px", background: n ? (b.testament === "ot" ? "var(--gilt)" : "var(--lapis)") : "var(--rule)" }} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>Genesis</span><span>Malachi | Matthew</span><span>Revelation</span></div>
                  <details className="mt-2"><summary className="cursor-pointer text-sm">Show as a list</summary>
                    <ul className="mt-2 grid grid-cols-2 gap-x-6 text-sm sm:grid-cols-3">{res.data.byBook.map((n, i) => n ? <li key={i}><button type="button" className="text-lapis underline" onClick={() => set({ scope: BOOKS[i].osis })}>{BOOKS[i].name}</button> {n}</li> : null)}</ul>
                  </details>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="mb-4" onClick={() => set({ scope: null })}>Search the whole Bible instead</Button>
              )}
              <div className="max-w-3xl">
                {grouped.map(([b, hits]) => (
                  <section key={b} aria-label={BOOKS[b].name} className="mb-6">
                    <h2 className="mb-1 text-lg">{BOOKS[b].name} <span className="text-sm font-normal text-muted-foreground">{res.data!.byBook[b]}</span></h2>
                    <ul>
                      {hits.map((h) => (
                        <li key={h.id} className="border-b py-2.5 last:border-0">
                          <Link to={versePath(h.id, { t: tr })} className="font-semibold">{formatVerseId(h.id)}</Link>
                          <p className="scripture !max-w-none text-[1.0625rem]"><Highlighted text={h.text} terms={terms} /></p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                {res.data.hits.length > shown && <Button variant="outline" onClick={() => setShown((s) => s + PAGE)}>Show more</Button>}
                {res.data.total > res.data.hits.length && shown >= res.data.hits.length && <p className="text-sm text-muted-foreground">Showing the first {res.data.hits.length.toLocaleString()}. Narrow the search by book to see the rest.</p>}
              </div>
            </>
          ) : null}
        </section>
      )}
    </Page>
  );
}
