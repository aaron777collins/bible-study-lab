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

test.describe("fixes from the visual review", () => {
  test("the reader toolbar stays on one row at 390px, even for Psalms 119", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./#/read/psalms/119");
    await page.locator("#v1 button[data-vbtn]").waitFor();
    const bar = page.locator(".sticky.top-14").first();
    const ys = await bar.locator("> *").evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent).map((e) => { const r = e.getBoundingClientRect(); return Math.round((r.top + r.bottom) / 2); }));
    expect(Math.max(...ys) - Math.min(...ys), "all toolbar controls share a row").toBeLessThanOrEqual(2);
    await expect(page.getByRole("button", { name: /^Psalms 119\./ })).toContainText("Psalms 119");
  });

  test("a word's comma stays on the line with the word", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./#/read/john/3?ow=1");
    await page.locator("#v1 button[data-vbtn]").waitFor();
    const bad = await page.locator("#v1 .strongs-word").evaluateAll((els) => {
      let n = 0;
      for (const el of els) {
        const next = el.nextSibling;
        const t = next && next.nodeType === 3 ? next.textContent ?? "" : (next as HTMLElement | null)?.textContent ?? "";
        if (!/^[,.:;!?]/.test(t)) continue;
        const range = document.createRange();
        range.setStart(next!, 0);
        range.setEnd(next!, 1);
        const a = el.getBoundingClientRect();
        const b = range.getBoundingClientRect();
        if (Math.abs(a.bottom - b.bottom) > 4 && a.right < b.left === false) n++;
      }
      return n;
    });
    expect(bad).toBe(0);
  });

  test("the compare column header hides the text scrolling under it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("./#/read/john/3?with=web,asv");
    await page.locator("#v1 button[data-vbtn]").waitFor();
    const header = page.locator("[data-verses] .sticky").first();
    const bg = await header.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(bg).not.toMatch(/rgba\(.*, 0(\.\d+)?\)|transparent/);
    expect(bg).not.toMatch(/\/ 0?\.\d+\)/);
  });

  test("book flows label every row at 11px or more and show a readout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("./#/insights?tab=flows");
    const svg = page.locator("svg[role=img]").first();
    await expect(svg).toBeVisible();
    const sizes = await svg.locator("xpath=ancestor::div[contains(@class, \"overflow-x-auto\")]").locator("text").evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    expect(sizes.length).toBe(132);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
    await svg.locator("rect").nth(66 * 3 + 39).dispatchEvent("click");
    await expect(page.getByTestId("flow-readout")).toContainText(/ to .*: .* votes/);
  });

  test("search shows a message, then results", async ({ page }) => {
    await page.goto("./#/search?q=living%20water");
    await expect(page.getByTestId("result-count")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("section[aria-label=Results] a").first()).toBeVisible();
  });
});

test.describe("insights heat maps on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("book flows keeps its row labels in view while scrolling sideways", async ({ page }) => {
    await page.goto("./#/insights?tab=flows");
    const grid = page.getByRole("img", { name: /^Heat grid/ });
    await expect(grid).toBeVisible();
    const result = await grid.evaluate(async (svg) => {
      const box = svg.closest(".overflow-x-auto") as HTMLElement;
      const label = box.querySelector("svg[aria-hidden] text") as SVGTextElement;
      const left = () => label.getBoundingClientRect().left - box.getBoundingClientRect().left;
      const before = left();
      box.scrollLeft = 300;
      await new Promise((r) => setTimeout(r, 200));
      return { scrolled: box.scrollLeft, before, after: left() };
    });
    expect(result.scrolled, "the grid really scrolled").toBeGreaterThan(100);
    expect(Math.abs(result.after - result.before), "row label did not move").toBeLessThan(1);
  });
});

test.describe("site header is opaque", () => {
  test.use({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  test("no content shows through the header in dark mode on desktop", async ({ page }) => {
    await page.goto("./#/read/john/3");
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    const styles = await header.evaluate((e) => {
      const s = getComputedStyle(e);
      return { backgroundColor: s.backgroundColor, backdropFilter: s.backdropFilter };
    });
    expect(styles.backgroundColor).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(styles.backdropFilter).toBe("none");
  });
});

for (const scheme of ["light", "dark"] as const) {
  for (const [label, viewport] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]] as const) {
    test.describe(`reader toolbar is opaque, ${scheme} ${label}`, () => {
      test.use({ viewport, colorScheme: scheme });
      test("no content shows through the toolbar after scrolling", async ({ page }) => {
        await page.goto("./#/read/john/3");
        await page.locator("#v1 button[data-vbtn]").waitFor();
        await page.evaluate(() => window.scrollTo(0, 900));
        await page.waitForTimeout(200);
        const bar = page.getByTestId("reader-toolbar");
        await expect(bar).toBeVisible();
        const styles = await bar.evaluate((e) => {
          const s = getComputedStyle(e);
          return { backgroundColor: s.backgroundColor, backdropFilter: s.backdropFilter };
        });
        expect(styles.backgroundColor).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
        expect(styles.backdropFilter).toBe("none");
      });
    });
  }
}
