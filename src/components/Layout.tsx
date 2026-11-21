import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from "react-router";
import { BookOpen, Compass, Home, MoreHorizontal, NotebookPen, Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useCommandMenu } from "@/lib/commandStore";
import { ThemeToggle } from "./ThemeToggle";
import { readPath } from "@/lib/nav";
import { usePrefs, resolveTheme } from "@/lib/prefs";
import { BOOKS } from "@/lib/canon/books";

const CommandMenu = lazy(() => import("./CommandMenu"));
const Deferred = lazy(() => import("./DeferredUi"));

/** Mount something once the page has had a moment to paint. */
function AfterPaint({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(() => setReady(true), { timeout: 1200 }) : window.setTimeout(() => setReady(true), 400);
    return () => (w.cancelIdleCallback ? w.cancelIdleCallback(id) : clearTimeout(id));
  }, []);
  return ready ? <Suspense fallback={null}>{children}</Suspense> : null;
}

const TOP_LINKS = [
  { to: "/read", label: "Read" },
  { to: "/explore", label: "Explore" },
  { to: "/insights", label: "Insights" },
  { to: "/topics", label: "Topics" },
  { to: "/plans", label: "Plans" },
  { to: "/notes", label: "Notes" },
];

const MORE_LINKS = [
  { to: "/insights", label: "Insights", hint: "Most connected verses, heat map, words" },
  { to: "/path", label: "Paths between verses", hint: "How two verses connect" },
  { to: "/search", label: "Search", hint: "Words, phrases and references" },
  { to: "/topics", label: "Topics", hint: "Verses on thousands of subjects" },
  { to: "/plans", label: "Reading plans", hint: "Read a little each day" },
  { to: "/memorize", label: "Memorize", hint: "Learn verses by heart" },
  { to: "/books", label: "Book overviews", hint: "A plain introduction to each book" },
  { to: "/settings", label: "Settings", hint: "Text size, theme, offline use" },
  { to: "/help", label: "Help and shortcuts", hint: "Get the most from the app" },
  { to: "/about", label: "About and data sources", hint: "Credits and licenses" },
];

export function useReadHref(): string {
  const last = usePrefs((s) => s.last);
  const book = last?.book ?? BOOKS.findIndex((b) => b.osis === "John");
  return readPath(book, last?.chapter ?? 1);
}

export function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const readHref = useReadHref();
  const loc = useLocation();
  const setOpen = useCommandMenu((s) => s.setOpen);
  const everOpened = useCommandMenu((s) => s.everOpened);
  const theme = usePrefs((s) => s.theme);
  void theme;
  void resolveTheme;
  const reading = loc.pathname.startsWith("/read");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.tagName === "SELECT");
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const s = useCommandMenu.getState();
        s.setOpen(!s.open);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        useCommandMenu.getState().setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tab = (isActive: boolean) =>
    `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium no-underline ${isActive ? "text-lapis" : "text-muted-foreground"}`;

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <button type="button" className="skip-link" onClick={() => mainRef.current?.focus()}>
          Skip to content
        </button>
        <header className="no-print sticky top-0 z-30 border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
          <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-3 px-4">
            <Link to="/" className="flex items-center gap-2 text-foreground no-underline" aria-label="Bible Study Lab, home">
              <Logo />
              <span className="text-[1.0625rem] font-semibold tracking-tight">Bible Study Lab</span>
            </Link>
            <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
              {TOP_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to === "/read" ? readHref : l.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-[0.9375rem] font-medium no-underline hover:bg-accent ${isActive || (l.to === "/read" && reading) ? "text-lapis underline decoration-2 underline-offset-[10px]" : "text-foreground"}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="outline" size="sm" className="hidden gap-2 text-muted-foreground md:inline-flex" onClick={() => setOpen(true)}>
                <Search aria-hidden="true" /> Search
                <kbd className="ml-4 rounded border bg-wash px-1.5 text-xs" aria-hidden="true">Ctrl K</kbd>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Search or go to a verse">
                <Search aria-hidden="true" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 pb-20 outline-none md:pb-0">
          <Outlet />
        </main>

        <footer className="no-print hidden border-t py-4 text-sm text-muted-foreground md:block">
          <div className="mx-auto flex max-w-[88rem] flex-wrap items-center gap-x-6 gap-y-1 px-4">
            <span>Free and private. No accounts, no tracking.</span>
            <Link to="/about">About and data sources</Link>
            <Link to="/help">Help</Link>
            <a href="https://github.com/aaron777collins/bible-study-lab" rel="noreferrer">Source code</a>
          </div>
        </footer>

        <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
          <NavLink to="/" end className={({ isActive }) => tab(isActive)}>
            <Home className="size-5" aria-hidden="true" /> Today
          </NavLink>
          <NavLink to={readHref} className={() => tab(reading)}>
            <BookOpen className="size-5" aria-hidden="true" /> Read
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => tab(isActive)}>
            <Compass className="size-5" aria-hidden="true" /> Explore
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => tab(isActive)}>
            <NotebookPen className="size-5" aria-hidden="true" /> Notes
          </NavLink>
          <button type="button" className={tab(false)} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
            <MoreHorizontal className="size-5" aria-hidden="true" /> More
          </button>
        </nav>

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
              <SheetDescription className="sr-only">Other pages in Bible Study Lab</SheetDescription>
            </SheetHeader>
            <ul className="grid gap-1 px-4 pb-6">
              {MORE_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} onClick={() => setMoreOpen(false)} className="block rounded-md px-3 py-3 text-foreground no-underline hover:bg-accent">
                    <span className="font-medium">{l.label}</span>
                    <span className="block text-sm text-muted-foreground">{l.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SheetContent>
        </Sheet>

        {everOpened && <Suspense fallback={null}><CommandMenu /></Suspense>}
        <AfterPaint><Deferred /></AfterPaint>
        <ScrollRestoration getKey={(l) => l.pathname} />
      </div>
    </>
  );
}
