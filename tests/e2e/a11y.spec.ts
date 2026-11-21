import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accessibility in ${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    for (const r of ROUTES) {
      test(`${r.name} has no axe violations`, async ({ page }) => {
        await page.goto(r.path);
        await expect(page.locator("main")).toBeVisible();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(400);
        const results = await new AxeBuilder({ page: page as never }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
        expect(summary).toEqual([]);
      });
    }
  });
}
