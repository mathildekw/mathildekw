import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const pages = ["documents-vendre-bien-tahiti.html", "preparer-visite-immobiliere-tahiti.html", "acheter-ou-louer-tahiti.html", "orienter-projet-immobilier-tahiti.html", "comparer-biens-immobiliers-tahiti.html"];
for (const page of pages) {
  const html = await readFile(new URL(page, root), "utf8");
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page} doit avoir un seul H1`);
  assert.match(html, /project-tools\.css/);
  assert.match(html, /project-tools\.js/);
  assert.match(html, /global-shell\.js/);
  assert.match(html, /ne (?:remplace|constitue)|sans (?:prétendre|estimer)/i, `${page} doit présenter ses limites`);
}
const script = await readFile(new URL("project-tools.js", root), "utf8");
assert.match(script, /localStorage\.setItem/);
assert.match(script, /reportValidity/);
assert.match(script, /prefers-reduced-motion/);
assert.match(script, /project_orientation_completed/);
assert.match(script, /property_comparison_completed/);
for (const destination of ["diagnostic-foncier.html", "pourquoi-mon-bien-ne-se-vend-pas.html", "capacite-emprunt-polynesie.html"]) assert.ok(script.includes(destination));
console.log("project-tools: checklists et guide de décision contrôlés");
