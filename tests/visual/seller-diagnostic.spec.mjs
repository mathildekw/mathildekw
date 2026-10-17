import { expect, test } from "@playwright/test";

async function answer(page, label) {
  await page.getByText(label, { exact: true }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
}

test("le diagnostic vendeur complet crée un lead puis un rendez-vous", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mk_analytics_consent", "denied"));
  await page.route("**/seller-diagnostic/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/leads")) return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "10000000-0000-4000-8000-000000000001", reference: "PKV-TEST0001", booking_token: "synthetic-token", priority: "P1", sheet_sync: "synced" }) });
    if (path.endsWith("/slots")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ timezone: "Pacific/Tahiti", slots: [{ start_at: "2026-11-02T19:00:00.000Z", end_at: "2026-11-02T19:45:00.000Z", local_label: "lun. 2 nov., 09:00" }] }) });
    if (path.endsWith("/appointments")) return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ confirmed: true, reference: "RDV-TEST0001", timezone: "Pacific/Tahiti" }) });
    return route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
  });
  await page.goto("/pourquoi-mon-bien-ne-se-vend-pas.html");
  await page.getByText("Maison", { exact: true }).click();
  await page.getByLabel("Île *").fill("Tahiti");
  await page.getByLabel("Commune *").fill("Commune fictive");
  await page.getByRole("button", { name: /Continuer/ }).click();
  await answer(page, "3 à 6 mois");
  await page.getByText("Mandat exclusif", { exact: true }).click();
  await page.getByText("Oui", { exact: true }).click();
  await expect(page.locator("[data-mandate-details]")).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.getByText("Sites immobiliers", { exact: true }).click();
  await page.getByText("Photos professionnelles", { exact: true }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await answer(page, "Quelques visites");
  await answer(page, "Aucune");
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.getByText("Aucun retour", { exact: true }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await answer(page, "Vendre dans les 3 mois");
  await page.getByLabel("Prénom *").fill("Malia");
  await page.getByLabel("Nom *", { exact: true }).fill("Test-Fictif");
  await page.getByLabel("Téléphone *").fill("+689 87 00 00 00");
  await page.getByLabel("Email *").fill("malia.test@example.invalid");
  await page.getByLabel(/J'accepte le traitement/).check();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByText(/Ton bien suscite un certain intérêt/)).toBeVisible();
  await expect(page.getByText(/Dossier enregistré · PKV-TEST0001/)).toBeVisible();
  await page.getByRole("button", { name: /Demander mon audit/ }).click();
  await page.getByRole("button", { name: /Confirmer ce rendez-vous/ }).click();
  await expect(page.getByText(/Rendez-vous confirmé · RDV-TEST0001/)).toBeVisible();
});

test("une panne serveur conserve les réponses et affiche une erreur utile", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mk_analytics_consent", "denied");
    localStorage.setItem("mk_seller_diagnostic_v1", JSON.stringify({ property_type:"Maison", island:"Tahiti", commune:"Commune fictive", sale_duration:"3 à 6 mois", sale_method:"Je vends seul", mandate_active:"Non", diffusion_channels:["Sites immobiliers"], presentation_assets:[], visits_level:"Quelques visites", offers_status:"Aucune", feedback:["Aucun retour"], objective:"Vendre dans les 3 mois", first_name:"Malia", last_name:"Test-Fictif", phone:"87000000", email:"malia.test@example.invalid", privacy_consent:true }));
  });
  await page.route("**/seller-diagnostic/leads", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "indisponible" }) }));
  await page.goto("/pourquoi-mon-bien-ne-se-vend-pas.html");
  for (let step = 0; step < 10; step++) await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByText(/L'enregistrement n'a pas abouti/)).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem("mk_seller_diagnostic_v1"));
  expect(saved).toContain("Test-Fictif");
});
