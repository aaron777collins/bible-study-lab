import { useEffect, useRef, type ReactNode } from "react";
import { TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * A tab bar that stays on one row and scrolls sideways when it is too wide,
 * with 44px tall tabs, and keeps the selected tab in view.
 */
export function ScrollTabsList({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = ref.current;
    const active = list?.querySelector<HTMLElement>('[data-state="active"]');
    if (!list || !active) return;
    const left = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, left) });
  }, [value]);
  return (
    <TabsList
      ref={ref}
      className={cn(
        "relative w-full flex-nowrap justify-start overflow-x-auto overscroll-x-contain bg-wash [scrollbar-width:thin] group-data-[orientation=horizontal]/tabs:h-auto",
        "[&>[data-slot=tabs-trigger]]:h-11 [&>[data-slot=tabs-trigger]]:flex-none [&>[data-slot=tabs-trigger]]:px-3.5",
        className,
      )}
    >
      {children}
    </TabsList>
  );
}
