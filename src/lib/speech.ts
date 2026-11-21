/** Read aloud with the browser's built in speech. Nothing leaves the device. */
export const speechSupported = (): boolean => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

export interface Reader {
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

/** Speak each item in order. onItem fires as each starts, onEnd when finished or stopped. */
export function readAloud(items: string[], onItem: (index: number) => void, onEnd: () => void): Reader {
  const synth = window.speechSynthesis;
  synth.cancel();
  let stopped = false;
  let i = 0;
  const next = () => {
    if (stopped || i >= items.length) {
      if (!stopped) onEnd();
      return;
    }
    const idx = i++;
    const u = new SpeechSynthesisUtterance(items[idx]);
    u.lang = "en";
    u.rate = 0.95;
    u.onstart = () => onItem(idx);
    u.onend = next;
    u.onerror = () => {
      if (!stopped) onEnd();
    };
    synth.speak(u);
  };
  next();
  return {
    stop: () => {
      stopped = true;
      synth.cancel();
      onEnd();
    },
    pause: () => synth.pause(),
    resume: () => synth.resume(),
  };
}
