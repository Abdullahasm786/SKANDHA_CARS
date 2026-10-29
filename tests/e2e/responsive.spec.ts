import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [320, 375, 414, 768, 1024, 1440];
const PAGES = ["/", "/about", "/privacy", "/terms", "/offline", "/admin/login", "/does-not-exist"];

async function overflowing(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad: string[] = [];
    document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1) && getComputedStyle(el).position !== "fixed") {
        // ignore content inside intentionally scrollable regions
        if (!el.closest("[data-allow-overflow], .overflow-x-auto, .overflow-hidden, .marquee")) bad.push(`${el.tagName}.${String(el.className).slice(0, 50)}`);
      }
    });
    return { scroll: document.documentElement.scrollWidth - vw, bad: bad.slice(0, 5) };
  });
}

test.describe("no horizontal overflow on any page at any width", () => {
  for (const w of WIDTHS) {
    test(`${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      const carLinks = new Set<string>();
      for (const p of PAGES) {
        await page.goto(p);
        await page.waitForLoadState("networkidle");
        if (p === "/") (await page.locator('a[href^="/cars/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")!))).slice(0, 2).forEach((h) => carLinks.add(h));
        const r = await overflowing(page);
        expect(r.scroll, `${p} @${w}: ${r.bad.join(", ")}`).toBeLessThanOrEqual(0);
      }
      for (const href of carLinks) {
        await page.goto(href);
        await page.waitForLoadState("networkidle");
        const r = await overflowing(page);
        expect(r.scroll, `${href} @${w}: ${r.bad.join(", ")}`).toBeLessThanOrEqual(0);
      }
    });
  }
});

test("mobile menu covers the whole screen and closes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Site menu" });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBe(0); expect(box!.y).toBe(0);
  expect(Math.round(box!.width)).toBe(375); expect(Math.round(box!.height)).toBe(700);
  // the page heading must not show through the menu
  const top = await page.evaluate(() => document.elementFromPoint(100, 450)?.closest('[role="dialog"]') !== null);
  expect(top).toBe(true);
  await dialog.getByRole("link", { name: "Sold cars" }).click();
  await expect(dialog).toBeHidden();
});
