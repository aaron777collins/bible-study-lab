import { expect, test } from "@playwright/test";

test("a chapter that was opened before still opens offline", async ({ page, context }) => {
  await page.goto("./#/read/john/3?v=16");
  await expect(page.locator("#v16")).toBeVisible();
  // wait for the service worker to take control of the page
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await expect(page.locator("#v16")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#v16")).toBeVisible();
  await expect(page.locator("#v16")).toContainText("For God so loved the world");
  // a page that needs a file never fetched shows a clear message instead of breaking
  await page.goto("./#/read/psalms/23");
  await expect(page.getByText(/could not be loaded/)).toBeVisible();
  await context.setOffline(false);
});

test("downloading a translation for offline use saves its files", async ({ page }) => {
  await page.goto("./#/settings");
  await expect(page.getByRole("heading", { name: "Download for offline" })).toBeVisible();
  await page.getByLabel(/King James Version/).check();
  await page.getByRole("button", { name: /^Download/ }).click();
  await expect(page.getByText(/saved on this device/).first()).toBeVisible({ timeout: 60_000 });
});
