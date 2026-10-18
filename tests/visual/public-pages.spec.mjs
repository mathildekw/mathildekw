import { expect, test } from "@playwright/test";

const routes = [
  ["accueil", "/"],
  ["biens", "/biens-a-vendre-tahiti.html"],
  ["acquereur", "/acheter-bien-immobilier-tahiti.html"],
  ["estimation", "/estimation-immobiliere-tahiti.html"],
  ["foncier", "/foncier-promotion.html"],
  ["diagnostic", "/diagnostic-foncier.html"],
  ["contact", "/contact.html"],
  ["design-system", "/design-system.html"]
  ,["annonce-immersive-demo", "/annonce-immersive-demo.html"]
  ,["assistant-immobilier", "/assistant-immobilier-tahiti.html"]
];

for (const [name, path] of routes) {
  test(`${name} respecte le shell et le viewport`, async ({ page }, testInfo) => {
    await page.route("https://www.google-analytics.com/**", route => route.abort());
    await page.route("https://www.clarity.ms/**", route => route.abort());
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.locator("[data-global-shell]").waitFor({ state: "visible" });
    await expect(page.locator("[data-global-shell]")).toHaveCount(1);
    await expect(page.locator("[data-global-footer]")).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await testInfo.attach(`${name}-${testInfo.project.name}`, {
      body: await page.screenshot({ fullPage: true, animations: "disabled" }),
      contentType: "image/png"
    });
  });
}

test("le menu mobile est accessible et ferme avec Échap", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Scénario réservé au menu mobile");
  await page.goto("/foncier-promotion.html", { waitUntil: "domcontentloaded" });
  const toggle = page.locator(".mk-shell-toggle");
  await expect(toggle).toHaveAccessibleName("Ouvrir le menu");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});
