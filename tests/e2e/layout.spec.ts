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
