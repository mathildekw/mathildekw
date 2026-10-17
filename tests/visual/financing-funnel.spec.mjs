import { test, expect } from "@playwright/test";

test("financing funnel is responsive and reaches the indicative result", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mk_analytics_consent", "denied"));
  await page.route("**/buyer-funnel/public/events", (route) => route.fulfill({ status: 201, contentType: "application/json", body: '{"recorded":true}' }));
  await page.goto("/capacite-emprunt-polynesie.html");
  await expect(page.locator("h1")).toContainText("Combien peux-tu emprunter");
  await page.locator('[name="project_type"][value="main_home"]').check(); await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator('[name="purchase_mode"][value="alone"]').check(); await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator("#income1").fill("350000"); await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator('[name="has_charges"][value="no"]').check(); await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator('[name="contribution_choice"][value="2000000"]').check(); await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator('[name="duration_years"][value="20"]').first().check(); await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator("#employment1").selectOption({ label: "CDI" }); await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator('[name="property_found"][value="no"]').check(); await page.getByRole("button", { name: "Voir mon estimation" }).click();
  await expect(page.locator("[data-central]")).toContainText("F CFP");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
  await expect(page.locator("[data-result]")).toBeVisible();
});
