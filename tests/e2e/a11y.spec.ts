import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ROUTES } from "./routes";

async function expectNoViolations(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page: page as never }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(summary).toEqual([]);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accessibility in ${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    for (const r of ROUTES) {
      test(`${r.name} has no axe violations`, async ({ page }) => {
        await expectNoViolations(page, r.path);
      });
    }
  });

  // Phone width shows the bottom action bar and the scrolling grids, which desktop does not.
  test.describe(`accessibility at 390px in ${scheme} mode`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 390, height: 844 } });
    for (const r of ROUTES) {
      test(`${r.name} has no axe violations at 390px`, async ({ page }) => {
        await expectNoViolations(page, r.path);
      });
    }
  });
}
