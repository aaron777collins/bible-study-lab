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
