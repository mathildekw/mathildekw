import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const excluded = /^(?:admin-|portail-foncier|espace-vendeur|demo-espace-vendeur|suivi-vendeur|etude-fonciere-privee|dossier-promoteur)/;
const files = (await readdir(root)).filter(name => name.endsWith(".html") && !excluded.test(name));

for (const file of files) {
  const html = await readFile(new URL(file, root), "utf8");
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
  const headings = [...html.matchAll(/<h([1-3])\b/gi)].map(match => Number(match[1]));
  assert.equal(headings.filter(level => level === 1).length, 1, `${file} doit contenir exactement un H1`);
  headings.forEach((level, index) => {
    if (index) assert.ok(level <= headings[index - 1] + 1, `${file} saute un niveau de titre`);
  });
  assert.match(html, /<meta[^>]+name=["']viewport["']/i, `${file} doit définir le viewport mobile`);
}

const shellCss = await readFile(new URL("global-shell.css", root), "utf8");
for (const requirement of ["44px", "prefers-reduced-motion", ":focus-visible", "overflow-x:clip", "text-wrap:balance"])
  assert.ok(shellCss.includes(requirement), `Règle UI globale manquante : ${requirement}`);

const siteScript = await readFile(new URL("site.js", root), "utf8");
assert.match(siteScript, /conditions-reutilisation/, "Le Baromètre doit exposer ses conditions de réutilisation");
assert.match(siteScript, /license:\s*\{/, "Le Dataset du Baromètre doit déclarer sa licence");
assert.match(siteScript, /1 147 annonces actives analysées/, "L’accueil doit contextualiser les données du Baromètre");

console.log(`ui-structure: ${files.length} pages contrôlées`);
