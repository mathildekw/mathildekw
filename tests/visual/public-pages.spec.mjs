import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const stableScreenshotCss = fileURLToPath(new URL("./stable-screenshot.css", import.meta.url));

const routes = [
  ["accueil", "/"],
  ["biens", "/biens-a-vendre-tahiti.html"],
  ["estimation", "/estimation-immobiliere-tahiti.html"],
  ["foncier", "/foncier-promotion.html"],
  ["diagnostic", "/diagnostic-foncier.html"],
  ["contact", "/contact.html"],
  ["design-system", "/design-system.html"]
];

async function stabilizeVisualState(page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight, 600);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    window.scrollTo(0, 0);

    const images = [...document.images];
    const loaded = Promise.all(images.map(image => {
      if (image.complete) return Promise.resolve();
      return new Promise(resolve => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }));
    await Promise.race([
      loaded,
      new Promise(resolve => setTimeout(resolve, 5_000))
    ]);
    await document.fonts.ready;
  });
}

for (const [name, path] of routes) {
  test(`${name} respecte le shell et le viewport`, async ({ page }) => {
    await page.route("https://www.google-analytics.com/**", route => route.abort());
    await page.route("https://www.clarity.ms/**", route => route.abort());
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.locator("[data-global-shell]").waitFor({ state: "visible" });
    await expect(page.locator("[data-global-shell]")).toHaveCount(1);
    await expect(page.locator("[data-global-footer]")).toHaveCount(1);
    await stabilizeVisualState(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      // Remote/lazy media can be encoded differently across runners. Masking
      // it keeps the comparison focused on layout, spacing and crop defects.
      mask: [page.locator("img, video, canvas, iframe")],
      maskColor: "#607d8b",
      stylePath: stableScreenshotCss
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
