import { test, expect } from "@playwright/test";

test("tutorial opens on first visit and can be skipped", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("spice-tutorial-seen");
  });
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Step 1 of")).toBeVisible();

  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  const seen = await page.evaluate(() => localStorage.getItem("spice-tutorial-seen"));
  expect(seen).toBe("true");

  await page.reload();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("starting tutorial from settings closes the panel", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("spice-tutorial-seen", "true");
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "Start tutorial" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeHidden();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("robots and sitemap endpoints respond", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("<urlset");
});
