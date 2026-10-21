import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const folders = readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory() && entry.name.startsWith("estimation-immobiliere-") && entry.name !== "estimation-immobiliere-tahiti");
assert.equal(folders.length, 50, "Le répertoire local doit contenir exactement 50 pages quartier");
const descriptions = new Set();
for (const folder of folders) {
  const html = readFileSync(resolve(root, folder.name, "index.html"), "utf8");
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${folder.name} doit avoir un seul H1`);
  assert.match(html, /<link rel="canonical" href="https:\/\/mathildekw\.com\/estimation-immobiliere-/);
  assert.match(html, /data-event="click_local_estimation_final"/);
  assert.match(html, /source=seo-quartier/);
  assert.match(html, /Pas de chiffre inventé/);
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(description && description.length <= 165, `${folder.name} doit avoir une méta-description concise`);
  assert.ok(!descriptions.has(description), `${folder.name} doit avoir une méta-description unique`);
  descriptions.add(description);
}
const hub = readFileSync(resolve(root, "estimation-quartiers-tahiti.html"), "utf8");
assert.equal((hub.match(/data-area=/g) || []).length, 50, "L’annuaire doit lier les 50 quartiers");
const sitemap = readFileSync(resolve(root, "sitemap-quartiers.xml"), "utf8");
assert.equal((sitemap.match(/<url>/g) || []).length, 50, "Le sitemap local doit contenir 50 URL");
const estimation = readFileSync(resolve(root, "site.js"), "utf8");
assert.match(estimation, /local_estimation_prefilled/);
assert.match(estimation, /params\.get\("quartier"\)/);
console.log("Local SEO pages: OK");
