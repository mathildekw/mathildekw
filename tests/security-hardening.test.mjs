import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const config = await readFile(new URL("site-config.js", root), "utf8");
const site = await readFile(new URL("site.js", root), "utf8");
const protection = await readFile(new URL("content-protection.js", root), "utf8");
const migration = await readFile(new URL("supabase/migrations/20261020010000_public_api_rate_limits.sql", root), "utf8");
const formIntake = await readFile(new URL("supabase/functions/form-intake/index.ts", root), "utf8");
const assistant = await readFile(new URL("supabase/functions/website-assistant/index.ts", root), "utf8");

assert.match(config, /content-protection\.js/);
assert.match(site, /content-protection\.js/);
for (const behavior of ["contextmenu", "dragstart", 'addEventListener("copy"', "data-allow-copy", "@media print"])
  assert.ok(protection.includes(behavior), `Protection publique manquante : ${behavior}`);
assert.match(protection, /input, textarea, select/);
assert.match(migration, /enable row level security/i);
assert.match(migration, /revoke all .* anon, authenticated/i);
assert.match(migration, /security definer/i);
for (const source of [formIntake, assistant]) {
  assert.match(source, /withinRateLimit/);
  assert.match(source, /Origine non autorisée/);
  assert.match(source, /Requête trop volumineuse/);
  assert.match(source, /status[^\n]*429|, 429/);
}

console.log("security-hardening: protections navigateur et API contrôlées");
