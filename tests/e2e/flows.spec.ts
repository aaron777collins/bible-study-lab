import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ context, browserName }) => {
  if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});

/** Open a tab of the study panel: docked on desktop, behind the action bar on a phone. */
const openTab = async (page: Page, name: "Notes" | "Share" | "Links") => {
  const bar = page.getByTestId("action-bar");
  if (await bar.isVisible()) await bar.getByRole("button", { name: name === "Notes" ? "Note" : name }).click();
  else await page.getByRole("tab", { name: new RegExp(`^${name === "Links" ? "Links" : name}`) }).click();
};

const selectVerse = async (page: Page, v: number) => {
  await page.locator(`#v${v} button[data-vbtn]`).click();
  await expect(page).toHaveURL(new RegExp(`v=${v}`));
};

test("search finds living water in John 4:10 and a phrase narrows results", async ({ page }) => {
  await page.goto("./#/search?q=living%20water&t=kjv");
  await expect(page.getByTestId("result-count")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("section[aria-label=Results]").getByRole("link", { name: "John 4:10" })).toBeVisible();
  const all = Number((await page.getByTestId("result-count").textContent())!.match(/([\d,]+)/)![1].replace(",", ""));
  await page.goto("./#/search?q=%22living%20water%22&t=kjv");
  await expect(page.getByTestId("result-count")).toBeVisible();
  const phrase = Number((await page.getByTestId("result-count").textContent())!.match(/([\d,]+)/)![1].replace(",", ""));
  expect(phrase).toBeGreaterThan(0);
  expect(phrase).toBeLessThanOrEqual(all);
  await expect(page.locator("section[aria-label=Results]").getByRole("link", { name: "John 4:10" })).toBeVisible();
  await page.goto("./#/search?q=qzxwvk");
  await expect(page.getByText(/No verses match/)).toBeVisible({ timeout: 30_000 });
});

test("compare KJV, WEB and ASV; the URL holds the state and a reload keeps it", async ({ page }) => {
  await page.goto("./#/read/john/3?t=kjv&with=web,asv");
  const compare = page.getByRole("group", { name: /John chapter 3, compared/ });
  await expect(compare).toBeVisible();
  await expect(compare).toContainText("only begotten Son");
  await expect(compare).toContainText("only born Son");
  await page.reload();
  await expect(page.getByRole("group", { name: /compared/ })).toContainText("only born Son");
  expect(page.url()).toContain("with=web,asv");
});

test("connections: open, filter to strong links, follow one, see the breadcrumb", async ({ page }) => {
  await page.goto("./#/verse/john/3/16");
  await expect(page.getByRole("heading", { name: "Ranked connections" })).toBeVisible();
  await expect(page.getByText(/\d+ links?(?: of \d+)?, strongest first/)).toBeVisible();
  await page.getByRole("radio", { name: "20 or more votes" }).click();
  await expect(page).toHaveURL(/min=20/);
  const first = page.locator("section[aria-label='Ranked connections'] li").first();
  await expect(first).toContainText("Strong");
  await first.getByRole("link", { name: /Connections from here/ }).click();
  await expect(page).toHaveURL(/trail=/);
  await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText("John 3:16");
});

test("path: Genesis 22:8 to John 1:29 is found, and raising the strength can remove it", async ({ page }) => {
  await page.goto("./#/path?a=Gen%2022%3A8&b=John%201%3A29&min=5");
  await expect(page.getByRole("region", { name: "Result" }).getByRole("heading", { level: 2 })).toContainText(/\d steps?/, { timeout: 30_000 });
  const steps = await page.getByRole("region", { name: "Result" }).getByRole("heading", { level: 2 }).textContent();
  expect(steps).toMatch(/[1-8] steps?/);
  await page.goto("./#/path?a=Gen%201%3A1&b=Jude%201%3A25&min=50");
  await expect(page.getByText(/No path with links of 50 or more votes/)).toBeVisible({ timeout: 30_000 });
});

test("insights: tabs render, the heat map opens a chapter", async ({ page }) => {
  await page.goto("./#/insights");
  await expect(page.getByRole("heading", { name: "Most referenced verses" })).toBeVisible();
  await page.getByRole("tab", { name: "Chapter heat map" }).click();
  const cell = page.getByRole("region", { name: /Chapter heat map/ }).getByRole("link", { name: /^John 3,/ });
  await cell.scrollIntoViewIfNeeded();
  await cell.click();
  await expect(page).toHaveURL(/#\/read\/john\/3/);
});

test("word study: loved in John 3:16 is G25 with occurrences", async ({ page }) => {
  await page.goto("./#/read/john/3?v=16&ow=1&panel=words");
  await page.locator("#v16").getByRole("button", { name: /^loved, Strong's G25/ }).click();
  await expect(page.getByTestId("study-panel")).toContainText("G25");
  await expect(page.getByTestId("study-panel")).toContainText("agap");
  await page.getByRole("link", { name: "See every verse" }).click();
  await expect(page).toHaveURL(/#\/word\/G25/);
  await expect(page.getByText(/\d+ verses/).first()).toBeVisible();
});

test("notes: first save warns, then note, highlight and bookmark persist; the banner shows until export", async ({ page }) => {
  await page.goto("./#/read/john/3");
  await selectVerse(page, 16);
  await openTab(page, "Notes");
  await page.getByLabel("Your note").fill("God's love is for the whole world.");
  await page.getByLabel(/Tags/).fill("grace, love");
  await page.getByRole("button", { name: "Save note" }).click();
  const dialog = page.getByRole("dialog", { name: /Your notes stay in this browser/ });
  await expect(dialog).toContainText("saved only in this browser");
  await dialog.getByRole("button", { name: "I understand" }).click();
  await expect(page.getByText("Note saved")).toBeVisible();
  await page.getByRole("button", { name: "Gold highlight" }).click();
  await page.getByRole("button", { name: "Bookmark this passage" }).click();
  await expect(page.getByTestId("notes-banner")).toBeVisible();
  await page.reload();
  await expect(page.locator("#v16")).toHaveAttribute("data-hl", "gold");
  await expect(page.getByTestId("notes-banner")).toBeVisible();
  await page.goto("./#/notes");
  await expect(page.getByText("God's love is for the whole world.")).toBeVisible();
  await expect(page.getByText("#grace").first()).toBeVisible();
});

test("export downloads a file and a fresh browser imports the same notes", async ({ page, browser }, testInfo) => {
  await page.goto("./#/read/john/3");
  await selectVerse(page, 16);
  await openTab(page, "Notes");
  await page.getByLabel("Your note").fill("Portable note");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.getByRole("button", { name: "I understand" }).click();
  await expect(page.getByText("Note saved")).toBeVisible();
  await page.getByRole("button", { name: "Gold highlight" }).click();

  await page.goto("./#/notes?tab=backup");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export-notes").click()]);
  expect(download.suggestedFilename()).toMatch(/^bible-study-notes-\d{4}-\d{2}-\d{2}\.json$/);
  const saved = testInfo.outputPath("backup.json");
  await download.saveAs(saved);
  const json = JSON.parse(fs.readFileSync(saved, "utf8"));
  expect(json.app).toBe("bible-study-lab");
  expect(json.counts.notes).toBe(1);
  await page.goto("./#/");
  await expect(page.getByTestId("notes-banner")).toHaveCount(0);

  // a fresh browser context has nothing, then imports the file
  const ctx = await browser.newContext();
  const fresh = await ctx.newPage();
  await fresh.goto("./#/notes?tab=backup");
  await fresh.getByTestId("import-file").setInputFiles(saved);
  await expect(fresh.getByRole("dialog", { name: "Import this backup?" })).toContainText("1 note, 1 highlight");
  await fresh.getByTestId("import-merge").click();
  await fresh.goto("./#/notes");
  await expect(fresh.getByText("Portable note")).toBeVisible();
  await fresh.goto("./#/notes?tab=highlights");
  await expect(fresh.getByRole("link", { name: "John 3:16" })).toBeVisible();
  await ctx.close();
});

test("an import that is not a backup is refused with a clear message", async ({ page }, testInfo) => {
  const bad = testInfo.outputPath("bad.json");
  fs.writeFileSync(bad, JSON.stringify({ app: "other", schema: 1 }));
  await page.goto("./#/notes?tab=backup");
  await page.getByTestId("import-file").setInputFiles(bad);
  await expect(page.getByRole("alert")).toContainText("not made by Bible Study Lab");
});

test("a shared collection link opens in another browser", async ({ page, browser, browserName }) => {
  test.skip(browserName !== "chromium", "reads the clipboard, which only Chromium allows in tests");
  await page.goto("./#/read/john/3");
  await selectVerse(page, 16);
  await openTab(page, "Share");
  await page.getByRole("button", { name: "Start a new collection with this" }).click();
  await page.getByRole("button", { name: "I understand" }).click();
  await expect(page.getByText(/Added to Study/)).toBeVisible();
  await page.goto("./#/notes?tab=collections");
  await page.getByLabel("Collection title").fill("Week 3: grace");
  await page.getByLabel("Short note for the group").fill("Read before we meet");
  await page.getByLabel("Short note for the group").blur();
  await page.getByRole("button", { name: /Copy share link/ }).click();
  await expect(page.getByText(/Link copied/)).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("#/c/");
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await other.goto(link);
  await expect(other.getByRole("heading", { name: "Week 3: grace" })).toBeVisible();
  await expect(other.getByText("For God so loved the world")).toBeVisible();
  await other.getByRole("button", { name: "Save to my collections" }).click();
  await other.getByRole("button", { name: "I understand" }).click();
  await expect(other.getByText("Saved to your collections")).toBeVisible();
  await ctx.close();
});

test("a verse card downloads as a PNG of the right size", async ({ page }) => {
  await page.goto("./#/read/john/3");
  await selectVerse(page, 16);
  await openTab(page, "Share");
  await page.getByRole("button", { name: "Make a verse card" }).click();
  const canvas = page.getByTestId("card-canvas");
  await expect(canvas).toBeVisible();
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => `${c.width}x${c.height}`)).toBe("1080x1080");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save picture" }).click()]);
  const buf = fs.readFileSync((await download.path())!);
  expect(buf.subarray(1, 4).toString()).toBe("PNG");
  expect(buf.readUInt32BE(16)).toBe(1080);
  expect(buf.readUInt32BE(20)).toBe(1080);
  await page.getByRole("radio", { name: "Story" }).click();
  await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => `${c.width}x${c.height}`)).toBe("1080x1920");
});

test("a reading plan can be started and a day marked done", async ({ page }) => {
  await page.goto("./#/plans/john-21");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "I understand" }).click();
  await expect(page.getByRole("heading", { name: /Day 1 of 21/ })).toBeVisible();
  await page.getByRole("button", { name: "Mark today as read" }).click();
  await expect(page.getByText("1 of 21 days done")).toBeVisible();
  await page.goto("./#/");
  await expect(page.getByRole("region", { name: "Reading plans" })).toContainText("John 1");
});

test("memorize: add a verse and review it", async ({ page }) => {
  await page.goto("./#/memorize");
  await page.getByLabel(/Add a verse/).fill("John 3:16");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("button", { name: "I understand" }).click();
  await expect(page.getByText("Added to your memory verses")).toBeVisible();
  await page.getByRole("button", { name: "Start review" }).click();
  await expect(page.getByText("F__ G__ s_")).toBeVisible();
  await page.getByRole("button", { name: "Show the verse" }).click();
  await expect(page.getByText(/For God so loved the world/)).toBeVisible();
});
