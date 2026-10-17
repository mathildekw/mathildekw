import { test, expect } from "@playwright/test";
test("join hub and referral funnel are responsive", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mk_analytics_consent", "denied"));
  await page.route("**/buyer-funnel/public/events", (route) => route.fulfill({ status: 201, contentType: "application/json", body: '{"recorded":true}' }));
  await page.goto("/nous-rejoindre/");
  await expect(page.locator("h1")).toContainText("travaillait ensemble");
  const menuButton = page.getByRole("button", { name: "Ouvrir le menu" });
  if (await menuButton.isVisible()) await menuButton.click();
  await expect(page.getByRole("link", { name: "Nous rejoindre" })).toBeVisible();
  await page.goto("/nous-rejoindre/apporteur-affaires/");
  await page.locator('[name="property_type"][value="Maison"]').check();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator("#island").selectOption("Tahiti");
  await page.locator("#city").fill("Punaauia");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.locator('[name="seller_project_stage"]')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
});
