import { Navigate } from "react-router";
import { BOOKS } from "@/lib/canon/books";
import { usePrefs } from "@/lib/prefs";
import { readPath } from "@/lib/nav";

export function Component() {
  const last = usePrefs((s) => s.last);
  return <Navigate to={readPath(last?.book ?? BOOKS.findIndex((b) => b.osis === "John"), last?.chapter ?? 1)} replace />;
}
