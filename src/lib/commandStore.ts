import { create } from "zustand";

/** Whether the search and go palette is open. The palette itself is loaded the first time it opens. */
export const useCommandMenu = create<{ open: boolean; everOpened: boolean; setOpen: (o: boolean) => void }>((set) => ({
  open: false,
  everOpened: false,
  setOpen: (open) => set((s) => ({ open, everOpened: s.everOpened || open })),
}));
