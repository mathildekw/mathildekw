import { test, expect } from "@playwright/test";

test("le carnet classe les biens selon les critères saisis", async ({ page }) => {
  await page.goto("/comparer-biens-immobiliers-tahiti.html");
  await page.locator('[name="p1_name"]').fill("Bien A");
  await page.locator('[name="p1_price"]').fill("30000000");
  await page.locator('[name="p1_surface"]').fill("60");
  await page.locator('[name="p1_location"]').selectOption("5");
  await page.locator('[name="p1_condition"]').selectOption("5");
  await page.locator('[name="p1_comfort"]').selectOption("5");
  await page.locator('[name="p2_name"]').fill("Bien B");
  await page.locator('[name="p2_location"]').selectOption("2");
  await page.locator('[name="p2_condition"]').selectOption("3");
  await page.locator('[name="p2_comfort"]').selectOption("3");
  await page.getByRole("button", { name: "Comparer mes biens" }).click();

  const result = page.locator("[data-compare-result]");
  await expect(result).toBeVisible();
  await expect(result.locator(".pt-rank")).toHaveCount(2);
  await expect(result.locator(".pt-rank").first()).toContainText("Bien A");
  await expect(result.locator(".pt-rank").first()).toContainText("15 / 15");
  await expect(result.locator(".pt-rank").first()).toContainText("500 000 F CFP/m² affiché");
});
