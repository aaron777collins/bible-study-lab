import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router";
import { toastLater as toast } from "@/lib/toastLater";
import { BookOpen, Compass, Image, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkedText } from "@/components/VerseText";
import { MiniArcs } from "@/components/MiniArcs";
import { NotesBanner } from "@/components/NotesBanner";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOKS } from "@/lib/canon/books";
import { formatVerseId } from "@/lib/canon/parse";
import { getJson } from "@/lib/data/load";
import { plain, verseText } from "@/lib/data/text";
import { connectionsPath, readPath, versePath } from "@/lib/nav";
import { dayNumber, formatPlanRange, loadPlan, planRangePath, progressSet, todayLocal } from "@/lib/plans";
import { usePrefs } from "@/lib/prefs";
import { useStoreQuery } from "@/lib/store/hooks";
import { listMemory, listPlans, listProgress, setDayDone } from "@/lib/store/repo";
import { linksForVerse } from "@/lib/xref/links";
import { translationById } from "@/lib/translations";

const VerseCardDialog = lazy(() => import("@/components/share/VerseCardDialog").then((m) => ({ default: m.VerseCardDialog })));

/** Day of the year in a leap year, so 29 February has its own verse and everyone sees the same verse on the same date. */
export function votdIndex(d = new Date()): number {
  const start = Date.UTC(2024, 0, 1);
  const today = Date.UTC(2024, d.getMonth(), d.getDate());
  return Math.round((today - start) / 86_400_000);
}

function TodayPlan({ planId, startDate }: { planId: string; startDate: string }) {
  const plan = useAsync(() => loadPlan(planId), [planId]);
  const { data: progress } = useStoreQuery(() => listProgress(planId), [], [planId]);
  const day = dayNumber(startDate, todayLocal());
  const done = progressSet(progress);
  if (!plan.data) return <Skeleton className="h-16 w-full" />;
  const readings = plan.data.days[day - 1];
  if (day < 1 || !readings) {
    return (
      <div>
        <p className="font-medium">{plan.data.name}</p>
        <p className="text-sm text-muted-foreground">{day < 1 ? "Starts soon." : "You have finished this plan. Well done."}</p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link to={`/plans/${planId}`} className="font-medium">{plan.data.name}</Link>
        <span className="text-sm text-muted-foreground">Day {day} of {plan.data.days.length}</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {readings.map((r, i) => (
          <li key={i}><Button asChild variant="outline" size="sm"><Link to={planRangePath(r)}>{formatPlanRange(r)}</Link></Button></li>
        ))}
      </ul>
      <Button className="mt-3" size="sm" variant={done.has(day) ? "secondary" : "default"} onClick={() => setDayDone(planId, day, !done.has(day)).then(() => !done.has(day) && toast.success("Marked as read"))}>
        {done.has(day) ? "Read today. Undo" : "Mark today as read"}
      </Button>
    </div>
  );
}

export function Component() {
  useDocumentTitle("");
  const tr = usePrefs((s) => s.translation);
  const last = usePrefs((s) => s.last);
  const votd = useAsync(() => getJson<number[]>("votd.json"), []);
  const id = votd.data?.[Math.min(votdIndex(), 365)];
  const text = useAsync(() => (id === undefined ? Promise.resolve("") : verseText(tr, id)), [id, tr]);
  const links = useAsync(() => (id === undefined ? Promise.resolve([]) : linksForVerse(id)), [id]);
  const { data: plans } = useStoreQuery(listPlans, []);
  const { data: memory } = useStoreQuery(listMemory, []);
  const due = useMemo(() => memory.filter((m) => m.dueAt <= Date.now()).length, [memory]);
  const [cardOpen, setCardOpen] = useState(false);
  const active = plans.filter((p) => p.active);
  const dateText = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-10">
      <NotesBanner className="mb-6" />
      <h1 className="mb-1 text-[1.75rem] md:text-[2.0625rem]">Today</h1>
      <p className="mb-6 text-muted-foreground">{dateText}</p>

      <section aria-label="Verse of the day" className="rounded-xl border bg-surface p-5 md:p-8">
        <h2 className="mb-3 text-base font-semibold text-muted-foreground">Verse of the day</h2>
        {id === undefined || text.loading ? (
          <Skeleton className="h-24 w-full max-w-xl" />
        ) : (
          <>
            <blockquote className="scripture !max-w-2xl text-[1.3125rem] md:text-[1.5rem]"><MarkedText text={text.data ?? ""} /></blockquote>
            <p className="mt-3 text-lg font-semibold">{formatVerseId(id)} <span className="text-sm font-normal text-muted-foreground">{translationById(tr).short}</span></p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild><Link to={versePath(id)}><BookOpen aria-hidden="true" /> Read in context</Link></Button>
              <Button asChild variant="outline"><Link to={connectionsPath(id)}><Compass aria-hidden="true" /> See its connections</Link></Button>
              <Button variant="outline" onClick={() => setCardOpen(true)}><Image aria-hidden="true" /> Share as image</Button>
            </div>
            <div className="mt-6 max-w-xl">
              <MiniArcs center={id} links={links.data ?? []} label={`The strongest cross references from ${formatVerseId(id)}, drawn as arcs across the Bible`} />
              <p className="text-xs text-muted-foreground">Each arc is a cross reference. {links.data ? `${links.data.length} in all.` : ""}</p>
            </div>
            {cardOpen && <Suspense fallback={null}><VerseCardDialog open={cardOpen} onOpenChange={setCardOpen} text={plain(text.data ?? "")} reference={formatVerseId(id)} translation={translationById(tr).short} /></Suspense>}
          </>
        )}
      </section>

      {id !== undefined && !text.loading && <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section aria-label="Continue reading" className="rounded-xl border bg-surface p-5">
          <h2 className="mb-2 text-lg">Continue reading</h2>
          {last ? (
            <>
              <p className="mb-3 text-muted-foreground">You were in {BOOKS[last.book].name} {last.chapter}.</p>
              <Button asChild><Link to={readPath(last.book, last.chapter)}>Continue in {BOOKS[last.book].name} {last.chapter}</Link></Button>
            </>
          ) : (
            <>
              <p className="mb-3 text-muted-foreground">New here? The Gospel of John is a good place to begin.</p>
              <Button asChild><Link to={readPath(BOOKS.findIndex((b) => b.osis === "John"), 1)}>Start with John 1</Link></Button>
            </>
          )}
        </section>

        <section aria-label="Reading plans" className="rounded-xl border bg-surface p-5">
          <h2 className="mb-2 text-lg">Today&rsquo;s reading</h2>
          {active.length === 0 ? (
            <>
              <p className="mb-3 text-muted-foreground">Pick a plan and read a little each day. Your progress stays in this browser.</p>
              <Button asChild variant="outline"><Link to="/plans">Choose a plan</Link></Button>
            </>
          ) : (
            <div className="grid gap-5">{active.map((p) => <TodayPlan key={p.planId} planId={p.planId} startDate={p.startDate} />)}</div>
          )}
        </section>

        {due > 0 && (
          <section aria-label="Memory verses" className="rounded-xl border bg-surface p-5">
            <h2 className="mb-2 text-lg">Memory verses</h2>
            <p className="mb-3 text-muted-foreground">{due} {due === 1 ? "verse is" : "verses are"} ready to review.</p>
            <Button asChild><Link to="/memorize">Review now</Link></Button>
          </section>
        )}

        <section aria-label="Explore" className="rounded-xl border bg-surface p-5">
          <h2 className="mb-2 text-lg">Explore</h2>
          <ul className="grid gap-1.5">
            <li><Link to="/explore">See how the whole Bible connects</Link></li>
            <li><Link to="/insights">The most connected verses and books</Link></li>
            <li><Link to="/topics">Find verses by topic</Link></li>
            <li><Link to="/search"><Search className="mr-1 inline size-4" aria-hidden="true" />Search the text</Link></li>
          </ul>
        </section>
      </div>}
    </div>
  );
}