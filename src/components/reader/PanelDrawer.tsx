import type { ReactNode } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

/** The study panel as a bottom sheet on phones and tablets. Loaded when a verse is first selected, not with the chapter. */
export function PanelDrawer({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88dvh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Study panel</DrawerTitle>
          <DrawerDescription>Connections, notes, word study and sharing for the selected verses</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-hidden" style={{ height: "80dvh" }}>{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
