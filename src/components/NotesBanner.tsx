import { useState } from "react";
import { Link, useLocation } from "react-router";
import { toastLater as toast } from "@/lib/toastLater";
import { Download, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { downloadBackup } from "@/lib/store/backup";
import { useStoreStatus } from "@/lib/store/db";
import { useMeta } from "@/lib/store/hooks";

/** A calm reminder that notes live only in this browser, until the first export. */
export function NotesBanner({ className = "" }: { className?: string }) {
  const meta = useMeta();
  const state = useStoreStatus((s) => s.state);
  const [hidden, setHidden] = useState(false);
  const onNotesPage = useLocation().pathname === "/notes";
  if (state === "unavailable") {
    return (
      <Alert className={className} role="status">
        <AlertTitle>Notes cannot be saved in this window</AlertTitle>
        <AlertDescription>
          This browser is blocking storage, which often happens in a private window. You can still read and explore everything. Open the app in a normal window to keep notes.
        </AlertDescription>
      </Alert>
    );
  }
  if (!meta.loaded || !meta.remind || hidden) return null;
  return (
    <Alert className={`${className} border-gilt/50`} role="status" data-testid="notes-banner">
      <AlertTitle>{meta.lastExportAt ? "Time to export a fresh copy" : "Keep your notes safe"}</AlertTitle>
      <AlertDescription>
        <p>Your notes are saved only in this browser. Export a copy to keep them safe.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={async () => {
              if (await downloadBackup()) toast.success("Notes exported");
            }}
          >
            <Download aria-hidden="true" /> Export notes
          </Button>
          {!onNotesPage && (
            <Button size="sm" variant="ghost" asChild>
              <Link to="/notes">See my notes</Link>
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" className="ml-auto" aria-label="Hide this reminder for now" onClick={() => setHidden(true)}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
