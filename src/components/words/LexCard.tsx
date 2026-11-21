import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { loadLex, loadOcc, strongsLanguage } from "@/lib/data/strongs";

/** Turn "from G1537 (ἐκ) and G5055" into text with links to those entries. */
export function LinkifyStrongs({ text }: { text: string }): ReactNode {
  const parts = text.split(/\b([GH]\d{1,4})\b/);
  return (
    <>
      {parts.map((p, i) =>
        /^[GH]\d{1,4}$/.test(p) ? (
          <Link key={i} to={`/word/${p}`}>{p}</Link>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export function LexCard({ num, compact = false }: { num: string; compact?: boolean }) {
  const lex = useAsync(() => loadLex(num), [num]);
  const occ = useAsync(() => loadOcc(num), [num]);
  if (lex.loading) return <Skeleton className="h-28 w-full" />;
  if (lex.error || !lex.data) return <p className="text-sm text-muted-foreground">No dictionary entry was found for {num}.</p>;
  const [lemma, translit, pron, derivation, def, kjv] = lex.data;
  const hebrew = num[0] === "H";
  return (
    <div className="rounded-md border bg-surface p-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span lang={hebrew ? "he" : "grc"} dir={hebrew ? "rtl" : undefined} className={`text-2xl ${hebrew ? "lang-he" : "lang-grc"}`}>{lemma}</span>
        <span className="font-medium">{translit}</span>
        {pron && <span className="text-sm text-muted-foreground">say it: {pron}</span>}
        <span className="ml-auto text-xs font-semibold text-muted-foreground">{strongsLanguage(num)} {num}</span>
      </div>
      {def && <p className="mt-2 text-[0.9375rem]"><span className="font-semibold">Meaning:</span> {def.replace(/[{}]/g, "")}</p>}
      {kjv && <p className="mt-1 text-sm"><span className="font-semibold">KJV renders it:</span> {kjv}</p>}
      {!compact && derivation && <p className="mt-1 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Origin:</span> <LinkifyStrongs text={derivation} /></p>}
      <p className="mt-2 text-sm">
        {occ.data ? (
          <>Tagged {occ.data.n.toLocaleString()} {occ.data.n === 1 ? "time" : "times"} in {occ.data.v.length.toLocaleString()} {occ.data.v.length === 1 ? "verse" : "verses"} of the KJV. </>
        ) : null}
        <Link to={`/word/${num}`}>See every verse</Link>
      </p>
    </div>
  );
}
