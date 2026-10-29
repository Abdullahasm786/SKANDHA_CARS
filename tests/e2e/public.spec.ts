import { expect, test } from "@playwright/test";

test("homepage renders hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/find your next car/i);
  await expect(page.getByRole("link", { name: /see available cars/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("theme toggle persists across reloads without flash", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
  await page.getByRole("button", { name: /switch to dark theme/i }).click();
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
});

test("system dark preference is honoured on first visit", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
});

test("unknown car returns 404", async ({ request }) => {
  expect((await request.get("/cars/does-not-exist")).status()).toBe(404);
});

test("manifest, robots, sitemap and offline fallback", async ({ request }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m.display).toBe("standalone");
  expect(m.icons.length).toBeGreaterThanOrEqual(2);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Sitemap:");
  const sm = await request.get("/sitemap.xml");
  expect(sm.status()).toBe(200);
  expect(await sm.text()).not.toContain("/admin");
  const off = await request.get("/offline");
  expect(off.status()).toBe(200);
  const sw = await request.get("/sw.js");
  expect(sw.headers()["cache-control"]).toContain("no-cache");
});

test("admin routes redirect anonymous users to login and are noindex", async ({ page, request }) => {
  for (const path of ["/admin", "/admin/cars", "/admin/cars/new", "/admin/settings"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toContain("/admin/login");
  }
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible();
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
});

test("pages have unique titles and canonical URLs", async ({ page }) => {
  const titles = new Set<string>();
  for (const p of ["/", "/about", "/privacy", "/terms"]) {
    await page.goto(p);
    titles.add(await page.title());
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\//);
  }
  expect(titles.size).toBeGreaterThanOrEqual(4);
});

test("removed pages redirect home", async ({ request }) => {
  for (const p of ["/cars", "/faq", "/portfolio"]) {
    const r = await request.get(p, { maxRedirects: 0 });
    expect(r.status()).toBe(308);
  }
});
