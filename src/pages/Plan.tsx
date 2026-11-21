import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "@/lib/toast";
import { Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { catchUpStart, dateOfDay, dayNumber, formatPlanRange, loadPlan, planRangePath, progressSet, streak, todayLocal } from "@/lib/plans";
import { useStoreQuery } from "@/lib/store/hooks";
import { catchUpPlan, listPlans, listProgress, setDayDone, startPlan, stopPlan } from "@/lib/store/repo";

export function Component() {
  const { id = "" } = useParams();
  const plan = useAsync(() => loadPlan(id), [id]);
  const { data: plans } = useStoreQuery(listPlans, []);
  const { data: progress } = useStoreQuery(() => listProgress(id), [], [id]);
  const state = plans.find((p) => p.planId === id);
  const [startInput, setStartInput] = useState(todayLocal());
  const [showAll, setShowAll] = useState(false);
  useDocumentTitle(plan.data?.name ?? "Reading plan");
  const done = useMemo(() => progressSet(progress), [progress]);

  if (plan.loading) return <Page title="Reading plan"><Skeleton className="h-64 w-full" /></Page>;
  if (!plan.data) return <Page title="Plan not found"><Button asChild><Link to="/plans">All plans</Link></Button></Page>;
  const p = plan.data;
  const total = p.days.length;
  const active = !!state?.active;
  const today = active ? dayNumber(state!.startDate, todayLocal()) : 0;
  const doneCount = done.size;
  const behind = active && today > 1 && [...Array(Math.min(today - 1, total)).keys()].some((i) => !done.has(i + 1));
  const visible = (() => {
    if (showAll || !active) return p.days.map((_, i) => i + 1).slice(0, showAll ? total : 14);
    const from = Math.max(1, Math.min(today, total) - 2);
    return Array.from({ length: Math.min(14, total - from + 1) }, (_, i) => from + i);
  })();

  return (
    <Page title={p.name} intro={p.description}>
      {!active ? (
        <section className="mb-8 rounded-xl border bg-surface p-5" aria-label="Start this plan">
          <h2 className="mb-2 text-lg">Start this plan</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="start">First day</Label>
              <Input id="start" type="date" value={startInput} onChange={(e) => setStartInput(e.target.value)} className="w-44" />
            </div>
            <Button onClick={async () => { await startPlan(id, startInput || todayLocal()); toast.success("Plan started"); }}>Start</Button>
          </div>
          {doneCount > 0 && <p className="mt-3 text-sm text-muted-foreground">You have {doneCount} days marked from an earlier start. They will count again.</p>}
        </section>
      ) : (
        <section className="mb-8 rounded-xl border bg-surface p-5" aria-label="Your progress">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg">{today < 1 ? "Starts soon" : today > total ? "Finished" : `Day ${today} of ${total}`}</h2>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Flame className="size-4 text-gilt" aria-hidden="true" /> {streak(done, today)} {streak(done, today) === 1 ? "day" : "days"} in a row</span>
          </div>
          <Progress value={(doneCount / total) * 100} className="my-3" aria-label={`${doneCount} of ${total} days done`} />
          <p className="text-sm text-muted-foreground">{doneCount} of {total} days done</p>
          {today >= 1 && today <= total && (
            <div className="mt-4">
              <ul className="flex flex-wrap gap-2">
                {p.days[today - 1].map((r, i) => <li key={i}><Button asChild variant="outline"><Link to={planRangePath(r)}>{formatPlanRange(r)}</Link></Button></li>)}
              </ul>
              <Button className="mt-3" variant={done.has(today) ? "secondary" : "default"} onClick={() => setDayDone(id, today, !done.has(today))}>
                <Check aria-hidden="true" /> {done.has(today) ? "Today is done. Undo" : "Mark today as read"}
              </Button>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {behind && (
              <Button variant="outline" onClick={async () => { await catchUpPlan(id, catchUpStart(todayLocal(), done, total)); toast.success("Caught up. The plan now starts from where you are."); }}>
                Catch up
              </Button>
            )}
            <Button variant="ghost" onClick={async () => { await stopPlan(id); toast("Plan paused. Your progress is kept."); }}>Pause this plan</Button>
          </div>
          {behind && <p className="mt-2 text-sm text-muted-foreground">Missed some days? Catch up moves the schedule so today is the first day you have not read.</p>}
        </section>
      )}

      <section aria-label="Schedule">
        <h2 className="mb-3 text-xl">Schedule</h2>
        <ol className="grid gap-1">
          {visible.map((d) => {
            const date = active ? dateOfDay(state!.startDate, d) : null;
            const isToday = d === today;
            return (
              <li key={d} className={`flex items-start gap-3 rounded-md border px-3 py-2.5 ${isToday ? "border-lapis bg-accent" : ""}`}>
                {active ? (
                  <Checkbox id={`day-${d}`} checked={done.has(d)} onCheckedChange={(v) => setDayDone(id, d, v === true)} className="mt-1 size-5" aria-label={`Day ${d} done`} />
                ) : <span className="w-5" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Day {d}{date ? `, ${new Date(date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}` : ""}{isToday ? ", today" : ""}</p>
                  <p className="flex flex-wrap gap-x-4 gap-y-1">
                    {p.days[d - 1].map((r, i) => <Link key={i} to={planRangePath(r)}>{formatPlanRange(r)}</Link>)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        {!showAll && total > visible.length && <Button variant="outline" className="mt-3" onClick={() => setShowAll(true)}>Show all {total} days</Button>}
      </section>
    </Page>
  );
}
