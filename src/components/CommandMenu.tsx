import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Compass, Hash, Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { BOOKS } from "@/lib/canon/books";
import { formatPassage, parseRef } from "@/lib/canon/parse";
import { passagePath, readPath } from "@/lib/nav";
import { create } from "zustand";

export const useCommandMenu = create<{ open: boolean; setOpen: (o: boolean) => void }>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

const PAGES: { label: string; to: string; keywords: string }[] = [
  { label: "Today", to: "/", keywords: "home verse of the day" },
  { label: "Explore cross references", to: "/explore", keywords: "arc network connections map" },
  { label: "Path between two verses", to: "/path", keywords: "find route link" },
  { label: "Insights", to: "/insights", keywords: "most referenced heat map words analytics" },
  { label: "Search the Bible", to: "/search", keywords: "find words" },
  { label: "Topics", to: "/topics", keywords: "subjects themes" },
  { label: "Reading plans", to: "/plans", keywords: "schedule daily" },
  { label: "Memorize", to: "/memorize", keywords: "memory verses review" },
  { label: "My notes", to: "/notes", keywords: "highlights bookmarks prayers export import" },
  { label: "Book overviews", to: "/books", keywords: "introductions summaries" },
  { label: "Settings", to: "/settings", keywords: "theme text size offline download" },
  { label: "About and data sources", to: "/about", keywords: "licenses credits" },
  { label: "Help and keyboard shortcuts", to: "/help", keywords: "shortcuts how to" },
];

export function CommandMenu() {
  const { open, setOpen } = useCommandMenu();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.tagName === "SELECT");
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useCommandMenu.getState().setOpen(!useCommandMenu.getState().open);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        useCommandMenu.getState().setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const query = q.trim();
  const ref = useMemo(() => (query ? parseRef(query) : null), [query]);
  const strongs = /^([GH])\s?(\d{1,4})$/i.exec(query);
  const lower = query.toLowerCase();
  const pages = PAGES.filter((p) => !lower || p.label.toLowerCase().includes(lower) || p.keywords.includes(lower));
  const books = lower ? BOOKS.map((b, i) => ({ b, i })).filter(({ b }) => b.name.toLowerCase().includes(lower)).slice(0, 8) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Search and go to</DialogTitle>
        <DialogDescription>Type a verse reference, a word to search for, or a page name.</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 top-[20%] translate-y-0" showCloseButton={false}>
      <Command shouldFilter={false} className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5">
        <CommandInput placeholder="A verse like John 3:16, a word, or a page" value={q} onValueChange={setQ} />
        <CommandList>
          {query && ref?.ok && (
            <CommandGroup heading="Go to">
              {ref.passages.map((p, i) => (
                <CommandItem key={i} value={`go-${i}`} onSelect={() => go(passagePath(p))}>
                  <BookOpen aria-hidden="true" /> {formatPassage(p)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {query && strongs && (
            <CommandGroup heading="Word study">
              <CommandItem value="strongs" onSelect={() => go(`/word/${strongs[1].toUpperCase()}${strongs[2]}`)}>
                <Hash aria-hidden="true" /> Open {strongs[1].toUpperCase()}
                {strongs[2]}
              </CommandItem>
            </CommandGroup>
          )}
          {query && (
            <CommandGroup heading="Search">
              <CommandItem value="search" onSelect={() => go(`/search?q=${encodeURIComponent(query)}`)}>
                <Search aria-hidden="true" /> Search the Bible for &ldquo;{query}&rdquo;
              </CommandItem>
            </CommandGroup>
          )}
          {books.length > 0 && (
            <CommandGroup heading="Books">
              {books.map(({ b, i }) => (
                <CommandItem key={b.osis} value={`book-${b.osis}`} onSelect={() => go(readPath(i, 1))}>
                  <BookOpen aria-hidden="true" /> {b.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {pages.length > 0 && (
            <CommandGroup heading="Pages">
              {pages.map((p) => (
                <CommandItem key={p.to} value={p.to} onSelect={() => go(p.to)}>
                  {p.to.startsWith("/explore") || p.to === "/path" ? <Compass aria-hidden="true" /> : <Sparkles aria-hidden="true" />} {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {query && !ref?.ok && !strongs && pages.length === 0 && books.length === 0 && <CommandEmpty>Nothing matches. Press Enter to search the text.</CommandEmpty>}
        </CommandList>
      </Command>
      </DialogContent>
    </Dialog>
  );
}
