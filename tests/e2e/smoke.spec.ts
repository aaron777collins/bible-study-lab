import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
});

test("the home page shows a verse of the day", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Verse of the day" })).toContainText(/\d/);
});

test("read John 3, select verse 16 with the keyboard and copy it", async ({ page }) => {
  await page.goto("./#/read/john/3");
  const v16 = page.locator("#v16 button[data-vbtn]");
  await expect(v16).toBeVisible();
  await v16.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/v=16/);
  await expect(page.getByTestId("study-panel")).toContainText("John 3:16");
  await page.keyboard.press("c");
  await expect(page.getByText("Copied John 3:16")).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toMatch(/^“For God so loved the world, that he gave his only begotten Son/);
  expect(clip).toMatch(/John 3:16 KJV$/);
});

test("search goes straight to a reference", async ({ page }) => {
  await page.goto("./#/search");
  await page.getByLabel("Search", { exact: true }).fill("Jn 3:16");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/read\/john\/3\?v=16/);
});

test("the arc view draws", async ({ page }) => {
  await page.goto("./#/explore?mode=verses");
  const canvas = page.getByTestId("arc-canvas");
  await expect(canvas).toBeVisible();
  await expect(page.getByText(/Showing [\d,]+ links/)).toBeVisible();
  const painted = await canvas.evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext("2d")!;
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
  expect(painted).toBeGreaterThan(1000);
});

test("no page errors on the main routes", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  for (const r of ["./", "./#/read/psalms/23", "./#/verse/john/3/16", "./#/insights", "./#/topics/hope", "./#/word/G26", "./#/notes"]) {
    await page.goto(r);
    await page.waitForLoadState("networkidle");
  }
  expect(problems).toEqual([]);
});
