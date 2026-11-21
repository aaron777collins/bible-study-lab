import type { ReactNode } from "react";

export function Page({ title, intro, children, wide = false, actions }: { title: string; intro?: ReactNode; children: ReactNode; wide?: boolean; actions?: ReactNode }) {
  return (
    <div className={`mx-auto w-full px-4 py-6 md:py-10 ${wide ? "max-w-[88rem]" : "max-w-3xl"}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] md:text-[2.0625rem]">{title}</h1>
          {intro && <div className="mt-2 max-w-prose text-[1.0625rem] text-muted-foreground">{intro}</div>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
