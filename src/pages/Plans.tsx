import { Link } from "react-router";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotesBanner } from "@/components/NotesBanner";
import { Page } from "@/components/Page";
import { useAsync } from "@/hooks/useAsync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { dayNumber, loadPlanIndex, todayLocal } from "@/lib/plans";
import { useStoreQuery } from "@/lib/store/hooks";
import { listPlans, startPlan } from "@/lib/store/repo";

export function Component() {
  useDocumentTitle("Reading plans");
  const idx = useAsync(loadPlanIndex, []);
  const { data: plans } = useStoreQuery(listPlans, []);
  const order = ["john-21", "gospels-40", "psalms-proverbs-31", "paul-30", "new-testament-90", "bible-in-a-year", "mcheyne"];
  const list = [...(idx.data ?? [])].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return (
    <Page title="Reading plans" intro="Read a little each day. If you miss days, Catch up moves the plan to where you are, with no list of failures. Your progress stays in this browser.">
      <NotesBanner className="mb-6" />
      {idx.loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ul className="grid gap-4">
          {list.map((p) => {
            const st = plans.find((x) => x.planId === p.id);
            const active = st?.active;
            return (
              <li key={p.id} className="rounded-xl border bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl"><Link to={`/plans/${p.id}`}>{p.name}</Link></h2>
                  <span className="text-sm text-muted-foreground">{p.days} days</span>
                </div>
                <p className="mt-1 text-muted-foreground">{p.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {active ? (
                    <>
                      <Button asChild><Link to={`/plans/${p.id}`}>Day {Math.max(1, dayNumber(st!.startDate, todayLocal()))}: open</Link></Button>
                    </>
                  ) : (
                    <Button onClick={async () => { await startPlan(p.id); toast.success(`Started ${p.name}`); }}>Start today</Button>
                  )}
                  <Button asChild variant="ghost"><Link to={`/plans/${p.id}`}>See the schedule</Link></Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
