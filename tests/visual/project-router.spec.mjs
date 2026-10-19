import { test, expect } from "@playwright/test";

test("le parcours guidé produit une orientation utile et navigable", async ({ page }) => {
  await page.goto("/orienter-projet-immobilier-tahiti.html");
  await page.locator('input[name="goal"][value="land"]').check();
  await page.locator('input[name="stage"][value="prepare"]').check();
  await page.locator('input[name="blocker"][value="rules"]').check();
  await page.getByRole("button", { name: "Construire mon plan d’action" }).click();

  const result = page.locator("[data-project-result]");
  await expect(result).toBeVisible();
  await expect(result.getByRole("heading", { level: 2 })).toContainText("potentiel");
  await expect(result.locator("li")).toHaveCount(3);
  await expect(result.locator("[data-plan-primary]")).toHaveAttribute("href", "/diagnostic-foncier.html");
});
