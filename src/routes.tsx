import { createHashRouter, Link, useRouteError } from "react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

function ErrorPage() {
  const err = useRouteError();
  return (
    <div className="mx-auto max-w-xl px-4 py-16" role="alert">
      <h1 className="text-2xl">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        {err instanceof Error && /load|fetch|network|import/i.test(err.message) ? "A file could not be loaded. If you are offline, open a page you have visited before, or reconnect and try again." : "This page hit a problem. Your notes are safe."}
      </p>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button variant="outline" asChild><Link to="/">Go to Today</Link></Button>
      </div>
    </div>
  );
}

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, lazy: () => import("./pages/Today") },
      { path: "read", lazy: () => import("./pages/ReadRedirect") },
      { path: "read/:book/:chapter", lazy: () => import("./pages/Read") },
      { path: "verse/:book/:chapter/:verse", lazy: () => import("./pages/Verse") },
      { path: "explore", lazy: () => import("./pages/Explore") },
      { path: "explore/:book", lazy: () => import("./pages/ExploreBook") },
      { path: "path", lazy: () => import("./pages/PathPage") },
      { path: "insights", lazy: () => import("./pages/Insights") },
      { path: "search", lazy: () => import("./pages/Search") },
      { path: "word/:strongs", lazy: () => import("./pages/Word") },
      { path: "topics", lazy: () => import("./pages/Topics") },
      { path: "topics/:slug", lazy: () => import("./pages/Topic") },
      { path: "books", lazy: () => import("./pages/Books") },
      { path: "books/:book", lazy: () => import("./pages/BookPage") },
      { path: "plans", lazy: () => import("./pages/Plans") },
      { path: "plans/:id", lazy: () => import("./pages/Plan") },
      { path: "memorize", lazy: () => import("./pages/Memorize") },
      { path: "notes", lazy: () => import("./pages/Notes") },
      { path: "c/:payload", lazy: () => import("./pages/SharedCollection") },
      { path: "sheet/:book/:chapter", lazy: () => import("./pages/StudySheet") },
      { path: "settings", lazy: () => import("./pages/Settings") },
      { path: "about", lazy: () => import("./pages/About") },
      { path: "help", lazy: () => import("./pages/Help") },
      { path: "*", lazy: () => import("./pages/NotFound") },
    ],
  },
]);
