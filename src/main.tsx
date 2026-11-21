import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./styles/globals.css";
import { router } from "./routes";
import { initPrefs } from "./lib/prefs";
import { purgeDeleted } from "./lib/store/repo";
import { getDb } from "./lib/store/db";

initPrefs();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
// open the notes database and remove anything deleted more than 30 days ago
void getDb().then((db) => db && purgeDeleted());
