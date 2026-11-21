import { useEffect } from "react";
import { toast } from "@/lib/toast";
import { Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadBackup } from "@/lib/store/backup";
import { closeWarn, useWarn } from "@/lib/store/warn";

/** Shown once, the first time someone saves anything. */
export function FirstSaveDialog() {
  const open = useWarn((s) => s.open);
  useEffect(() => {
    useWarn.setState({ registered: true });
    return () => useWarn.setState({ registered: false });
  }, []);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeWarn()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-gilt" aria-hidden="true" />
            Your notes stay in this browser
          </DialogTitle>
          <DialogDescription className="text-base text-foreground">
            Your notes are saved only in this browser on this device. Clearing browsing data, private windows, or switching devices can erase them. Export a copy to keep them safe.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              closeWarn();
              // the first note is saved right after this dialog closes, so export a moment later
              setTimeout(async () => {
                if (await downloadBackup()) toast.success("Notes exported");
              }, 1200);
            }}
          >
            <Download aria-hidden="true" /> Export now
          </Button>
          <Button onClick={closeWarn}>I understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
