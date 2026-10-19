import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const shell = await readFile(new URL("global-shell.js", root), "utf8");
const css = await readFile(new URL("global-shell.css", root), "utf8");

for (const label of ["Acheter & louer", "Vendre", "Foncier", "Conseils", "Nous rejoindre", "Contact"])
  assert.match(shell, new RegExp(`label:\"${label.replace("&", "&")}\"`));
for (const destination of ["/biens-a-vendre-tahiti.html", "/ou-vivre-a-tahiti.html", "/vendre/nos-accompagnements/", "/diagnostic-foncier.html", "/diviser-terrain-tahiti.html", "/blog.html", "/capacite-emprunt-polynesie.html", "/louer-bien-immobilier-tahiti.html"])
  assert.ok(shell.includes(destination), `Destination commerciale manquante : ${destination}`);
for (const behavior of ["aria-expanded", "aria-controls", "Escape", "popstate", "mk-menu-open", "submenu-open", "aria-current"])
  assert.ok(shell.includes(behavior), `Comportement manquant : ${behavior}`);
assert.ok(css.includes("--mk-shell-z:10000"), "Le menu doit rester au-dessus des scènes 3D");
assert.ok(css.includes("prefers-reduced-motion"), "Les animations réduites doivent être respectées");
assert.match(css, /\.mk-shell-item\.submenu-open[^}]*>[^{]*\.mk-shell-submenu/, "Les sous-menus mobiles doivent pouvoir être dépliés");

const entries = await readdir(root, { withFileTypes: true });
const publicPages = [];
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
  const html = await readFile(new URL(entry.name, root), "utf8");
  if (!/<header class="(?:topbar|h26-header|fp-nav)/.test(html)) continue;
  if (/^(?:admin-|portail-foncier|espace-vendeur|demo-espace-vendeur|suivi-vendeur|etude-fonciere-privee|dossier-promoteur)/.test(entry.name)) continue;
  publicPages.push(entry.name);
  assert.match(html, /(?:site\.js|site-config\.js|global-shell\.js)/, `${entry.name} ne charge pas la navigation globale`);
}
assert.ok(publicPages.length >= 30, "L'audit doit couvrir les pages publiques profondes");
console.log(`global-shell: ${publicPages.length} pages publiques couvertes`);
