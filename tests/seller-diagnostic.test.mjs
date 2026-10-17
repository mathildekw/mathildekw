import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { diagnoseSeller, qualifySeller } from "../seller-diagnostic-engine.mjs";

const expected = "Ton bien suscite un certain intérêt, mais aucune offre n'a encore concrétisé cet intérêt. Plusieurs explications sont possibles : décalage entre les attentes et la réalité, prix, objections lors des visites ou financement des acheteurs. Une analyse des retours de visites et du positionnement commercial pourrait aider à identifier les points à améliorer.";
assert.equal(diagnoseSeller({ sale_duration: "3 à 6 mois", visits_level: "Quelques visites", offers_status: "Aucune" }).summary, expected);
assert.match(diagnoseSeller({ sale_duration: "Moins d'un mois", visits_level: "Aucune", offers_status: "Aucune" }).summary, /recul disponible reste limité/i);
assert.match(diagnoseSeller({ sale_duration: "6 à 12 mois", visits_level: "Aucune", offers_status: "Aucune" }).summary, /visibilité, de la présentation/i);
assert.match(diagnoseSeller({ sale_duration: "6 à 12 mois", visits_level: "Beaucoup de visites", offers_status: "Aucune" }).summary, /aucune offre/i);
assert.match(diagnoseSeller({ sale_duration: "6 à 12 mois", visits_level: "Quelques visites", offers_status: "Des offres trop basses" }).summary, /écart peut refléter la négociation/i);
assert.match(diagnoseSeller({ sale_duration: "6 à 12 mois", visits_level: "Quelques visites", offers_status: "Une offre qui n'a pas abouti" }).summary, /raison réellement connue/i);
assert.equal(qualifySeller({ objective: "Vendre au plus vite", sale_duration: "6 à 12 mois" }), "P1");
assert.equal(qualifySeller({ objective: "Je réfléchis à changer de stratégie", sale_duration: "1 à 3 mois" }), "P2");
assert.equal(qualifySeller({ objective: "Je ne suis pas pressé", sale_duration: "Moins d'un mois" }), "P3");

const [html, sellerPage, browser, edge, migration, admin, sheet] = await Promise.all([
  readFile(new URL("../pourquoi-mon-bien-ne-se-vend-pas.html", import.meta.url), "utf8"),
  readFile(new URL("../vendre-bien-immobilier-tahiti.html", import.meta.url), "utf8"),
  readFile(new URL("../seller-diagnostic.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/functions/seller-diagnostic/index.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261017100000_seller_diagnostic_funnel.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/functions/foncier-admin/index.ts", import.meta.url), "utf8"),
  readFile(new URL("../integrations/google-apps-script/SuiviKWImpactWebhook.gs", import.meta.url), "utf8")
]);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.match(html, /id="seller-diagnostic-form"/);
assert.match(html, /type="module" src="\/seller-diagnostic\.js/);
assert.match(browser, /diagnoseSeller/);
assert.match(browser, /privacy_consent/);
assert.match(browser, /required: \["first_name", "last_name", "phone", "email", "privacy_consent"\]/);
assert.match(browser, /field\("email", "Email \*", "email", "required autocomplete=email"\)/);
assert.match(browser, /appointment_confirmed/);
assert.match(edge, /validEmail\(data\.email\)/);
assert.match(edge, /last_submission_hash/);
assert.match(edge, /book_seller_diagnostic_appointment/);
assert.match(edge, /seller_lead/);
assert.match(migration, /enable row level security/g);
assert.match(migration, /is_foncier_admin/);
assert.match(migration, /pg_advisory_xact_lock/);
assert.match(admin, /seller_diagnostic_leads/);
assert.match(sheet, /seller_lead/);
assert.match(sellerPage, /href="\/pourquoi-mon-bien-ne-se-vend-pas\.html"/);
assert.match(sellerPage, /Votre bien ne se vend pas/);
console.log("seller-diagnostic: 27 assertions réussies");
