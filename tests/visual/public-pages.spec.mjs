import { expect, test } from "@playwright/test";

const routes = [
  ["accueil", "/"],
  ["biens", "/biens-a-vendre-tahiti.html"],
  ["acquereur", "/acheter-bien-immobilier-tahiti.html"],
  ["estimation", "/estimation-immobiliere-tahiti.html"],
  ["foncier", "/foncier-promotion.html"],
  ["diagnostic", "/diagnostic-foncier.html"],
  ["contact", "/contact.html"],
  ["honoraires-agence", "/honoraires-agence-immobiliere-tahiti.html"],
  ["vendre-immeuble", "/vendre-immeuble-tahiti.html"],
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
    // Certaines sections décoratives débordent volontairement avant d’être
    // rognées par `overflow-x: clip`. Elles ne doivent pas être comptées comme
    // une zone horizontalement navigable pour le visiteur.
    const overflow = await page.evaluate(() => {
      const bodyOverflow = getComputedStyle(document.body).overflowX;
      if (bodyOverflow === "clip" || bodyOverflow === "hidden") return 0;
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
    await testInfo.attach(`${name}-${testInfo.project.name}`, {
      body: await page.screenshot({ fullPage: true, animations: "disabled" }),
      contentType: "image/png"
    });
  });
}

test("le calculateur d’honoraires applique le barème et protège les cas spéciaux", async ({ page }) => {
  await page.goto("/honoraires-agence-immobiliere-tahiti.html", { waitUntil: "domcontentloaded" });
  const calculator = page.locator("[data-fees-calculator]");
  const price = calculator.getByLabel("Prix de vente envisagé", { exact: true });
  await price.fill("60000000");
  await expect(price).toHaveValue("60 000 000");
  await price.fill("50000000");
  await expect(price).toHaveValue("50 000 000");
  await expect(calculator.locator("[data-fees-ht]")).toHaveText("3 000 000 F CFP");
  await expect(calculator.locator("[data-fees-vat]")).toHaveText("390 000 F CFP");
  await expect(calculator.locator("[data-fees-total]")).toHaveText("3 390 000 F CFP");
  await calculator.getByLabel("Localisation du bien").selectOption("other");
  await expect(calculator.locator("[data-fees-total]")).toHaveText("Sur confirmation");
  await expect(calculator.locator("[data-fees-message]")).toContainText("aucun montant n’est supposé");
});

test("le menu mobile est accessible et ferme avec Échap", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "Scénario réservé au menu mobile");
  await page.goto("/foncier-promotion.html", { waitUntil: "domcontentloaded" });
  const toggle = page.locator(".mk-shell-toggle");
  await expect(toggle).toHaveAccessibleName("Ouvrir le menu");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  const foncierToggle = page.getByRole("button", { name: "Afficher le sous-menu Foncier" });
  await foncierToggle.click();
  await expect(foncierToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Puis-je diviser mon terrain ?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

test("l’assistant IA s’ouvre sans masquer la navigation", async ({ page }) => {
  await page.route("**/website-assistant", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ answer: "Je peux t’orienter vers le parcours vendeur.", category: "SELL", grounded: true, action: { label: "Découvrir le parcours Vendre", href: "/vendre-bien-immobilier-tahiti.html" } }) }));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const launcher = page.getByRole("button", { name: "Discuter avec l’assistant du site" });
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(launcher).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "Assistant immobilier IA" })).toBeVisible();
  await expect(page.getByLabel("Ton message pour l’assistant")).toBeFocused();
  await page.getByLabel("Ton message pour l’assistant").fill("Je veux vendre mon appartement");
  await page.getByRole("button", { name: "Envoyer le message à l’assistant" }).click();
  await expect(page.getByRole("log")).toContainText("parcours vendeur");
  const action = page.getByRole("link", { name: "Découvrir le parcours Vendre" });
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute("href", "/vendre-bien-immobilier-tahiti.html");
  await page.keyboard.press("Escape");
  await expect(launcher).toHaveAttribute("aria-expanded", "false");
});

test("la collecte email apparaît après trois minutes actives", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "Contrôle représentatif sur mobile");
  await page.clock.install();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.clock.fastForward("03:00");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toContainText("nouvelles offres Keller Williams");
  await expect(dialog.getByLabel("Ton adresse email")).toBeVisible();
  await expect(dialog.getByRole("checkbox")).toBeVisible();
});
