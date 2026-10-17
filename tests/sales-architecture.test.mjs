import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const guide = await readFile(new URL("guide/index.html", root), "utf8");
const accompaniment = await readFile(new URL("vendre/nos-accompagnements/index.html", root), "utf8");
const sitemap = await readFile(new URL("sitemap.xml", root), "utf8");
for (const [name, html] of [["guide", guide], ["accompagnement", accompaniment]]) {
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name}: un H1 attendu`);
  assert.match(html, /<meta name="description"/);
  assert.match(html, /<link rel="canonical"/);
  assert.match(html, /site-config\.js/);
}
for (const category of ["Vendre", "Acheter", "Marché immobilier", "Financement", "Terrain & foncier", "Dossiers particuliers"])
  assert.ok(guide.includes(category), `Catégorie guide manquante : ${category}`);
for (const content of ["Mandat simple", "Mandat Success", "data-choice-result", "Liberté", "Open", "Win-Win", "Confiance", "Fidélité"])
  assert.ok(accompaniment.includes(content), `Contenu accompagnement manquant : ${content}`);
assert.doesNotMatch(accompaniment, /15\s*jours|50\s*%|30\s*jours|60\s*jours|90\s*jours|-\s*25\s*%/i);
assert.ok(sitemap.includes("https://mathildekw.com/guide/"));
assert.ok(sitemap.includes("https://mathildekw.com/vendre/nos-accompagnements/"));
console.log("sales-architecture: navigation, guide et accompagnements contrôlés");
