import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const guide = read("guide-acheteur-tahiti.html");
const guideJs = read("buyer-guide.js");
const succession = read("blog/estimation-succession-indivision-terrain-familial-tahiti/index.html");
const prices = read("blog-prix-immobilier-tahiti-2025.html");
const sitemap = read("sitemap.xml");

assert.equal((guide.match(/<h1\b/g) || []).length, 1, "Le guide doit avoir un seul H1");
assert.match(guide, /<link rel="canonical" href="https:\/\/mathildekw\.com\/guide-acheteur-tahiti\.html">/);
assert.match(guide, /data-buyer-guide-form/);
assert.match(guide, /type="email"[^>]*required/);
assert.match(guide, /type="checkbox"[^>]*required/);
assert.match(guideJs, /buyer_guide_request/);
assert.match(guideJs, /buyer_guide_lead_saved/);
assert.match(succession, /"@type":"FAQPage"/);
assert.match(succession, /dateModified":"2026-10-21"/);
assert.match(prices, /prix-immobilier-punaauia\.html/);
assert.match(prices, /estimation-maison-moorea\.html/);
assert.match(sitemap, /guide-acheteur-tahiti\.html/);

console.log("SEO Search Console opportunities: OK");
