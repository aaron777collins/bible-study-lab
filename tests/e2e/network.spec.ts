import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";

test("opening John 3 makes no failed requests and logs no console errors", async ({ page }) => {
  const errors: string[] = [];
  const failed: string[] = [];
  const bad: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
  await page.goto("./#/read/john/3");
  await page.locator("#v16 button[data-vbtn]").waitFor();
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
  expect(bad).toEqual([]);
});

test("a book with no notes file is never asked for one", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.goto("./#/read/john/3");
  await page.locator("#v16 button[data-vbtn]").waitFor();
  await page.waitForLoadState("networkidle");
  expect(urls.filter((u) => /John\.notes\.json/.test(u))).toEqual([]);
});

test("a book that has notes still loads them", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.goto("./#/read/john/3?t=asv");
  await page.locator("#v16 button[data-vbtn]").waitFor();
  await page.waitForLoadState("networkidle");
  expect(urls.filter((u) => /text\/asv\/John\.notes\.json/.test(u))).toHaveLength(1);
});

// PLAN.md 8.4: the first screen of Today, Reader and Explore loads at most 215 KB of gzipped JavaScript.
// Measured 2026-11-22: 189, 192 and 210 KB. The shared vendor chunk alone is 125 KB.
for (const [name, hash] of [["Today", ""], ["Reader", "#/read/john/3"], ["Explore", "#/explore?mode=books"]]) {
  test(`${name} first load stays within the initial JavaScript budget`, async ({ page }) => {
    const sizes: Promise<number>[] = [];
    page.on("response", (r) => {
      if (r.url().endsWith(".js")) sizes.push(r.body().then((b) => gzipSync(b, { level: 6 }).length));
    });
    await page.goto("./" + hash);
    await page.waitForLoadState("networkidle");
    const kb = (await Promise.all(sizes)).reduce((a, b) => a + b, 0) / 1024;
    expect(kb, `${name} loads ${kb.toFixed(1)} KB of gzipped JS`).toBeLessThanOrEqual(215);
  });
}
