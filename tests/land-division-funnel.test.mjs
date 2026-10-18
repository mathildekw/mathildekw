import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("diviser-terrain-tahiti.html");
const script = read("division-terrain.js");
const css = read("division-terrain.css");
const leadFunction = read("supabase/functions/foncier-leads-v2/index.ts");
const migration = read("supabase/migrations/20261018130000_land_division_funnel.sql");
const dashboard = read("admin-foncier-v2.js");
const sellerPage = read("vendre-bien-immobilier-tahiti.html");
const globalShell = read("global-shell.js");
const foncierPage = read("foncier-promotion.html");
const sellerGuides = read("guide/index.html");

assert.equal((page.match(/<h1\b/g) || []).length, 1, "la page doit avoir un seul H1");
assert.match(page, /Puis-je diviser mon terrain à Tahiti/i);
assert.match(page, /Terrain fictif|Simulation illustrative/i);
assert.match(page, /3\s?600\s*m²/i);
assert.match(page, /service-public\.pf\/dca\/pga|Formulaire-NRA|cellule-topo/i);
assert.match(page, /te-fenua-adapter\.js/);
assert.match(page, /data-division-calculator/);
assert.doesNotMatch(page, /terrain est divisible|division autorisée|constructible garanti/i);

assert.match(script, /lead_type:\s*"division_land"/);
assert.match(script, /sur 10/);
assert.match(script, /Je ne connais pas la surface/);
assert.match(script, /à vérifier/i);
assert.match(script, /submission_fingerprint/);
assert.match(script, /conversionApiUrl\+"\/public\/appointments"/);
assert.match(script, /reportApiUrl/);
assert.match(script, /division_lead_recorded/);
assert.match(script, /OK, on a bien pris en compte toutes les informations/);
assert.match(script, /cfg=currentConfig\(\)/);
assert.match(script, /prefers-reduced-motion/);
assert.match(page, /<script src="\/site-config\.js"><\/script>/);

assert.match(css, /min-height:\s*44px/);
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
assert.match(css, /overflow-x:\s*hidden/);

assert.match(leadFunction, /leadType === "division_land"/);
assert.match(leadFunction, /unknownDivisionSurface/);
assert.match(leadFunction, /last_submission_hash/);
assert.match(leadFunction, /division_project/);

assert.match(migration, /add column if not exists lead_type/i);
assert.match(migration, /add column if not exists division_project/i);
assert.doesNotMatch(migration, /drop\s+(table|column)|truncate|delete\s+from/i);
assert.match(dashboard, /dataset\.view = "division"/);
assert.match(dashboard, /ne constitue jamais une validation de divisibilité/i);
assert.ok((sellerPage.match(/href="\/diviser-terrain-tahiti\.html"/g) || []).length >= 3, "la page Vendre doit proposer plusieurs accès contextuels au tunnel");
assert.match(globalShell, /label:"Diviser mon terrain",href:"\/diviser-terrain-tahiti\.html"/);
assert.match(globalShell, /label:"Les outils"/);
assert.match(foncierPage, /Conserve ta maison, vends une partie de ton terrain/);
assert.match(foncierPage, /Ton terrain familial peut-il être divisé/);
assert.ok((sellerGuides.match(/href="\/diviser-terrain-tahiti\.html"/g) || []).length >= 3, "les guides doivent relier les principaux contextes vendeurs au tunnel");

console.log("✓ tunnel division foncière : structure, prudence, stockage et parcours vérifiés");
