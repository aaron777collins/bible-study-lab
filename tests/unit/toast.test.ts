import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { dismiss, show } = vi.hoisted(() => {
  const dismiss = vi.fn();
  const show = Object.assign(
    vi.fn((_m: unknown, d?: { id?: string }) => d?.id ?? "auto"),
    { success: vi.fn((_m: unknown, d?: { id?: string }) => d?.id ?? "ok"), error: vi.fn(() => "err"), info: vi.fn(() => "i"), warning: vi.fn(() => "w"), dismiss },
  );
  return { dismiss, show };
});
vi.mock("sonner", () => ({ toast: show }));

import { toast, TOAST_MS } from "@/lib/toast";

describe("toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dismiss.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it("asks for the default length and dismisses by itself even if sonner is paused", () => {
    const id = toast.success("Saved");
    expect(show.success).toHaveBeenLastCalledWith("Saved", { duration: TOAST_MS });
    vi.advanceTimersByTime(TOAST_MS);
    expect(dismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(dismiss).toHaveBeenCalledWith(id);
  });

  it("keeps a toast that is meant to stay", () => {
    toast("New version", { duration: Infinity });
    vi.advanceTimersByTime(60_000);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it("a repeat with the same id restarts the clock", () => {
    toast("Offline", { id: "offline", duration: 6000 });
    vi.advanceTimersByTime(5000);
    toast("Offline", { id: "offline", duration: 6000 });
    vi.advanceTimersByTime(5000);
    expect(dismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("an explicit dismiss cancels the timer", () => {
    toast("Offline", { id: "offline" });
    toast.dismiss("offline");
    dismiss.mockClear();
    vi.advanceTimersByTime(10_000);
    expect(dismiss).not.toHaveBeenCalled();
  });
});
