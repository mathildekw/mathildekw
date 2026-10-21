import { expect, test } from "@playwright/test";

const routes = [
  "/estimation-immobiliere-punavai-punaauia/",
  "/estimation-immobiliere-paofai-papeete/",
  "/estimation-immobiliere-teahupoo-taiarapu-ouest/"
];

for (const route of routes) {
  test(`${route} reste lisible et mène au tunnel`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.locator("[data-global-shell]").waitFor({ state: "visible" });
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('[data-event="click_local_estimation_final"]')).toBeVisible();
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      buttons: [...document.querySelectorAll(".local-btn")].filter(button => {
        const rect = button.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }).length
    }));
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.buttons).toBe(0);
    expect(errors).toEqual([]);
  });
}
