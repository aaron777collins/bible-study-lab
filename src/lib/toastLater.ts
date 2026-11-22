/**
 * Shows a toast without loading the toast library up front. The library is about 10 kB and is not needed
 * to show the first screen, so the pages a visitor lands on use this and the library arrives with the first toast.
 */
const later = (kind: "success" | "error", message: string) => void import("./toast").then(({ toast }) => toast[kind](message));

export const toastLater = {
  success: (message: string) => later("success", message),
  error: (message: string) => later("error", message),
};
