import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

for (const width of [320, 375]) {
  test.describe(`no sideways page scroll at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });
    for (const r of ROUTES) {
      test(r.name, async ({ page }) => {
        await page.goto(r.path);
        await expect(page.locator("main")).toBeVisible();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(300);
        const over = await page.evaluate(() => {
          const el = document.scrollingElement!;
          return { scroll: el.scrollWidth, client: el.clientWidth };
        });
        expect(over.scroll, `scrollWidth ${over.scroll} > ${over.client}`).toBeLessThanOrEqual(over.client);
      });
    }
  });
}

test.describe("tab bars on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of ["./#/insights", "./#/notes"]) {
    test(`${path} stays on one row, 44px tall, and scrolls to the selected tab`, async ({ page }) => {
      await page.goto(path);
      const tabs = page.getByRole("tablist").first().getByRole("tab");
      await expect(tabs.first()).toBeVisible();
      const boxes = await tabs.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height) }; }));
      expect(new Set(boxes.map((b) => b.y)).size, "all tabs on one row").toBe(1);
      for (const b of boxes) expect(b.h).toBeGreaterThanOrEqual(44);
      const last = tabs.last();
      await last.scrollIntoViewIfNeeded();
      await last.click();
      const inside = await last.evaluate((e) => { const r = e.getBoundingClientRect(); const l = e.parentElement!.getBoundingClientRect(); return r.left >= l.left - 1 && r.right <= l.right + 1; });
      expect(inside, "selected tab is fully inside the bar").toBe(true);
      await page.reload();
      const again = await page.getByRole("tab", { selected: true }).first().evaluate((e) => { const r = e.getBoundingClientRect(); const l = e.parentElement!.getBoundingClientRect(); return r.left >= l.left - 1 && r.right <= l.right + 1; });
      expect(again, "after a reload the selected tab is in view").toBe(true);
    });
  }
});

test("a toast goes away by itself even with the pointer resting on it", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "copying a link needs the clipboard permission, which only Chromium grants here");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./#/read/john/3?v=16");
  await page.locator("#v16 button[data-vbtn]").waitFor();
  await page.getByRole("tab", { name: /^Share/ }).click();
  await page.getByRole("button", { name: /Copy a link|Share a link/ }).first().click();
  const toast = page.locator("[data-sonner-toast]").last();
  await expect(toast).toBeVisible();
  const bg = await toast.evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg, "toast has an opaque surface").not.toMatch(/rgba\(.*, 0\)|transparent/);
  const box = (await toast.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 9000 });
});
