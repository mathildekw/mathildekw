import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const page=read("ou-vivre-a-tahiti.html"),js=read("lifestyle-quiz.js"),css=read("lifestyle-quiz.css"),buyer=read("buyer-funnel.js");
assert.equal((page.match(/<h1\b/g)||[]).length,1);
assert.match(page,/Et si on trouvait le coin de Tahiti/);assert.match(page,/Aucune inscription nécessaire/);
for(const name of ["Punaauia","Faaa","Papeete","Pirae","Arue","Mahina","Paea","Papara","Taiarapu"])assert.match(js,new RegExp(name));
assert.match(js,/Aucun temps de trajet n’est estimé/);assert.match(js,/mk_lifestyle_handoff/);assert.match(buyer,/mk_lifestyle_handoff/);assert.match(js,/lifestyle_quiz_completed/);assert.match(js,/openstreetmap\.org\/copyright/);assert.match(css,/min-height:48px/);assert.match(css,/prefers-reduced-motion/);
console.log("✓ Mon Tahiti idéal : parcours, résultats, carte, partage et passerelle vérifiés");
